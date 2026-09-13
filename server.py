"""
SupplyPulse — FastAPI Backend Server
======================================
HTTP API layer for the React frontend.

Endpoints:
  POST /scan              — Upload image, stream pipeline progress via SSE
  GET  /catalog           — Live Notion product catalog
  GET  /sales-velocity    — Live Google Sheets velocity data
  GET  /health            — Integration status for all 5 services
  GET  /scan-history      — Log of past scans
  POST /resend-alert      — Re-send a previous scan's Slack alert

Run:
  uvicorn server:app --reload --port 8000
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

load_dotenv()

# ─────────────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("supplypulse.server")

app = FastAPI(
    title="SupplyPulse API",
    description="AI inventory management backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)
SCAN_HISTORY_FILE = LOGS_DIR / "scan_history.json"


# ─────────────────────────────────────────────────────────────────────
# Scan history helpers
# ─────────────────────────────────────────────────────────────────────

def _load_history() -> list[dict]:
    if not SCAN_HISTORY_FILE.exists():
        return []
    try:
        return json.loads(SCAN_HISTORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_history(entry: dict) -> None:
    history = _load_history()
    history.insert(0, entry)
    history = history[:100]  # keep last 100 scans
    SCAN_HISTORY_FILE.write_text(
        json.dumps(history, indent=2, default=str), encoding="utf-8"
    )


# ─────────────────────────────────────────────────────────────────────
# SSE helpers
# ─────────────────────────────────────────────────────────────────────

def _sse_event(event: str, data: Any) -> str:
    """Format a Server-Sent Event string."""
    payload = json.dumps(data, default=str)
    return f"event: {event}\ndata: {payload}\n\n"


def _sse_step(step: int, label: str, status: str = "running", detail: str = "") -> str:
    return _sse_event("step", {
        "step": step,
        "label": label,
        "status": status,   # running | done | error
        "detail": detail,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def _sse_result(result: dict) -> str:
    return _sse_event("result", result)


def _sse_error(message: str) -> str:
    return _sse_event("error", {"message": message})


# ─────────────────────────────────────────────────────────────────────
# POST /scan  — SSE streaming pipeline
# ─────────────────────────────────────────────────────────────────────

@app.post("/scan")
async def scan(
    image: UploadFile = File(..., description="Shelf photo (JPG or PNG)"),
    shop_name: str = Form(default="Main St Convenience"),
):
    """
    Accept a shelf image and stream pipeline progress as Server-Sent Events.

    Event types the frontend receives:
      step   — { step: 1-6, label, status: running|done|error, detail }
      result — full pipeline result JSON (sent once at the end)
      error  — { message } (sent if pipeline fails)
    """
    # Validate file type
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {image.content_type}. Use JPG or PNG.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image too large. Max 10 MB.")

    async def event_stream() -> AsyncGenerator[str, None]:
        # Save uploaded image to a temp file (pipeline expects a file path)
        with tempfile.NamedTemporaryFile(
            suffix=Path(image.filename or "upload.jpg").suffix, delete=False
        ) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            started = time.time()
            result: dict[str, Any] = {}

            # ── Step 1: Claude Vision ──
            yield _sse_step(1, "Analyzing shelf image with Claude Vision", "running")
            try:
                from supplypulse_agent import analyze_shelf_image
                vision_result = analyze_shelf_image(tmp_path)
                n = vision_result.get("detection_summary", {}).get("total_skus_identified", 0)
                conf = vision_result.get("detection_summary", {}).get("scan_confidence", 0)
                yield _sse_step(1, "Analyzing shelf image with Claude Vision", "done",
                                f"{n} SKUs detected (confidence: {conf})")
            except Exception as exc:
                yield _sse_step(1, "Analyzing shelf image with Claude Vision", "error", str(exc))
                yield _sse_error(f"Vision analysis failed: {exc}")
                return

            # ── Step 2: Notion catalog ──
            yield _sse_step(2, "Fetching product catalog from Notion", "running")
            catalog_db = None
            notion_live = False
            if os.getenv("NOTION_API_KEY") and os.getenv("NOTION_DATABASE_ID"):
                try:
                    from notion_integration import fetch_notion_catalog
                    catalog_db = fetch_notion_catalog()
                    notion_live = True
                    yield _sse_step(2, "Fetching product catalog from Notion", "done",
                                    f"{len(catalog_db)} SKUs loaded")
                except Exception as exc:
                    yield _sse_step(2, "Fetching product catalog from Notion", "error",
                                    f"Falling back to local data: {exc}")
            else:
                yield _sse_step(2, "Fetching product catalog from Notion", "done",
                                "Using local catalog (Notion not configured)")

            if catalog_db is None:
                from mock_data import MOCK_NOTION_CATALOG
                catalog_db = MOCK_NOTION_CATALOG

            # ── Step 3: Google Sheets ──
            yield _sse_step(3, "Loading sales velocity from Google Sheets", "running")
            sales_db = None
            sheets_live = False
            if os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE") and os.getenv("GOOGLE_SHEET_ID"):
                try:
                    from sheets_integration import fetch_sales_velocity
                    sales_db = fetch_sales_velocity()
                    sheets_live = True
                    yield _sse_step(3, "Loading sales velocity from Google Sheets", "done",
                                    f"{len(sales_db)} SKUs loaded")
                except Exception as exc:
                    yield _sse_step(3, "Loading sales velocity from Google Sheets", "error",
                                    f"Falling back to local data: {exc}")
            else:
                yield _sse_step(3, "Loading sales velocity from Google Sheets", "done",
                                "Using local data (Sheets not configured)")

            if sales_db is None:
                from mock_data import MOCK_SALES_VELOCITY
                sales_db = MOCK_SALES_VELOCITY

            # ── Step 4: Catalog matching ──
            yield _sse_step(4, "Matching products against catalog", "running")
            from supplypulse_agent import match_to_catalog
            matched_items = match_to_catalog(vision_result, catalog_db)
            n_matched = sum(1 for m in matched_items if m["matched"])
            n_manual = sum(1 for m in matched_items if m["requires_manual_mapping"])
            yield _sse_step(4, "Matching products against catalog", "done",
                            f"{n_matched} matched, {n_manual} need manual review")

            # ── Step 5: Reorder math ──
            yield _sse_step(5, "Calculating reorder quantities & urgency scores", "running")
            from supplypulse_agent import calculate_reorder_plan
            reorder_plan = calculate_reorder_plan(matched_items, sales_db)

            sheet_url = None
            if sheets_live:
                try:
                    from sheets_integration import write_reorder_to_sheet
                    sheet_url = write_reorder_to_sheet(reorder_plan, shop_name=shop_name)
                except Exception as exc:
                    logger.warning("Sheets write failed: %s", exc)

            yield _sse_step(5, "Calculating reorder quantities & urgency scores", "done",
                            f"{reorder_plan['items_to_reorder']} items · "
                            f"${reorder_plan['total_restock_cost']:.2f} total")

            # ── Step 6: Slack alert ──
            yield _sse_step(6, "Sending Slack alert", "running")
            from supplypulse_agent import build_slack_payload
            slack_payload = build_slack_payload(reorder_plan, shop_name=shop_name)

            slack_sent = False
            if os.getenv("SLACK_WEBHOOK_URL"):
                try:
                    from slack_integration import send_slack_alert
                    slack_sent = send_slack_alert(slack_payload)
                    yield _sse_step(6, "Sending Slack alert", "done",
                                    "Alert delivered ✓" if slack_sent else "Webhook failed")
                except Exception as exc:
                    yield _sse_step(6, "Sending Slack alert", "error", str(exc))
            else:
                yield _sse_step(6, "Sending Slack alert", "done", "Slack not configured")

            # ── Assemble final result ──
            elapsed = round(time.time() - started, 2)
            n_detected = vision_result.get("detection_summary", {}).get(
                "total_skus_identified", len(vision_result.get("items", []))
            )

            result = {
                "vision_result": vision_result,
                "matched_items": matched_items,
                "reorder_plan": reorder_plan,
                "slack_payload": slack_payload,
                "integrations": {
                    "claude_vision": True,
                    "notion": notion_live,
                    "google_sheets_read": sheets_live,
                    "google_sheets_write": sheet_url is not None,
                    "slack": slack_sent,
                },
                "sheet_url": sheet_url,
                "summary": {
                    "skus_detected": n_detected,
                    "skus_matched": n_matched,
                    "skus_manual_review": n_manual,
                    "items_to_reorder": reorder_plan["items_to_reorder"],
                    "total_estimated_cost": reorder_plan["total_restock_cost"],
                    "pipeline_duration_seconds": elapsed,
                    "scan_confidence": vision_result.get("detection_summary", {}).get(
                        "scan_confidence", 0
                    ),
                },
                "shop_name": shop_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            # Save to history
            history_entry = {
                "id": result["timestamp"],
                "timestamp": result["timestamp"],
                "shop_name": shop_name,
                "skus_detected": n_detected,
                "items_to_reorder": reorder_plan["items_to_reorder"],
                "total_cost": reorder_plan["total_restock_cost"],
                "slack_sent": slack_sent,
                "sheet_url": sheet_url,
                "slack_payload": slack_payload,
                "duration_seconds": elapsed,
            }
            _save_history(history_entry)

            # Save full result to logs
            (LOGS_DIR / "last_pipeline_run.json").write_text(
                json.dumps(result, indent=2, default=str), encoding="utf-8"
            )

            yield _sse_result(result)

        except Exception as exc:
            logger.error("Pipeline error: %s", traceback.format_exc())
            yield _sse_error(f"Pipeline failed: {exc}")
        finally:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except Exception:
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
            "Connection": "keep-alive",
        },
    )


# ─────────────────────────────────────────────────────────────────────
# GET /catalog
# ─────────────────────────────────────────────────────────────────────

@app.get("/catalog")
async def get_catalog():
    """Return the live Notion product catalog (falls back to mock data)."""
    if os.getenv("NOTION_API_KEY") and os.getenv("NOTION_DATABASE_ID"):
        try:
            from notion_integration import fetch_notion_catalog
            catalog = fetch_notion_catalog()
            return JSONResponse({"source": "notion", "count": len(catalog), "items": list(catalog.values())})
        except Exception as exc:
            logger.warning("Notion catalog fetch failed: %s", exc)

    from mock_data import MOCK_NOTION_CATALOG
    return JSONResponse({
        "source": "mock",
        "count": len(MOCK_NOTION_CATALOG),
        "items": list(MOCK_NOTION_CATALOG.values()),
    })


# ─────────────────────────────────────────────────────────────────────
# GET /sales-velocity
# ─────────────────────────────────────────────────────────────────────

@app.get("/sales-velocity")
async def get_sales_velocity():
    """Return live Google Sheets sales velocity data (falls back to mock)."""
    if os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE") and os.getenv("GOOGLE_SHEET_ID"):
        try:
            from sheets_integration import fetch_sales_velocity
            velocity = fetch_sales_velocity()
            return JSONResponse({
                "source": "google_sheets",
                "count": len(velocity),
                "items": [{"sku_id": k, **v} for k, v in velocity.items()],
            })
        except Exception as exc:
            logger.warning("Sheets velocity fetch failed: %s", exc)

    from mock_data import MOCK_SALES_VELOCITY
    return JSONResponse({
        "source": "mock",
        "count": len(MOCK_SALES_VELOCITY),
        "items": [{"sku_id": k, **v} for k, v in MOCK_SALES_VELOCITY.items()],
    })


# ─────────────────────────────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """
    Ping each integration and return live status.
    Each service gets a status: ok | error | unconfigured
    """
    results: dict[str, dict] = {}

    # Claude Vision (AWS Bedrock)
    try:
        t0 = time.time()
        client = boto3.client(
            "bedrock-runtime",
            region_name=os.environ.get("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )
        # Lightweight ping — list foundation models
        boto3.client("bedrock", region_name=os.environ.get("AWS_REGION", "us-east-1"),
                     aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
                     aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
                     ).list_foundation_models(byProvider="Anthropic", maxResults=1)
        results["claude_vision"] = {"status": "ok", "latency_ms": round((time.time() - t0) * 1000)}
    except Exception as exc:
        results["claude_vision"] = {"status": "error", "detail": str(exc)[:120]}

    # Notion
    if os.getenv("NOTION_API_KEY") and os.getenv("NOTION_DATABASE_ID"):
        try:
            import requests as req
            t0 = time.time()
            r = req.get(
                "https://api.notion.com/v1/users/me",
                headers={
                    "Authorization": f"Bearer {os.environ['NOTION_API_KEY']}",
                    "Notion-Version": "2022-06-28",
                },
                timeout=5,
            )
            if r.ok:
                results["notion"] = {"status": "ok", "latency_ms": round((time.time() - t0) * 1000)}
            else:
                results["notion"] = {"status": "error", "detail": f"HTTP {r.status_code}"}
        except Exception as exc:
            results["notion"] = {"status": "error", "detail": str(exc)[:120]}
    else:
        results["notion"] = {"status": "unconfigured"}

    # Google Sheets
    if os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE") and os.getenv("GOOGLE_SHEET_ID"):
        try:
            t0 = time.time()
            from sheets_integration import _get_client
            gc = _get_client()
            gc.open_by_key(os.environ["GOOGLE_SHEET_ID"])
            results["google_sheets"] = {"status": "ok", "latency_ms": round((time.time() - t0) * 1000)}
        except Exception as exc:
            results["google_sheets"] = {"status": "error", "detail": str(exc)[:120]}
    else:
        results["google_sheets"] = {"status": "unconfigured"}

    # Slack
    if os.getenv("SLACK_WEBHOOK_URL"):
        try:
            import requests as req
            t0 = time.time()
            # Send a no-op ping — empty payload returns an error but confirms connectivity
            r = req.post(
                os.environ["SLACK_WEBHOOK_URL"],
                json={"text": ""},
                timeout=5,
            )
            # Slack returns "no_text" error for empty payload but the webhook is reachable
            latency = round((time.time() - t0) * 1000)
            if r.status_code == 200 or "no_text" in r.text or "invalid_payload" in r.text:
                results["slack"] = {"status": "ok", "latency_ms": latency}
            else:
                results["slack"] = {"status": "error", "detail": r.text[:120]}
        except Exception as exc:
            results["slack"] = {"status": "error", "detail": str(exc)[:120]}
    else:
        results["slack"] = {"status": "unconfigured"}

    overall = "ok" if all(v["status"] == "ok" for v in results.values()) else "degraded"
    return JSONResponse({
        "overall": overall,
        "integrations": results,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────
# GET /scan-history
# ─────────────────────────────────────────────────────────────────────

@app.get("/scan-history")
async def scan_history():
    """Return log of past scans (most recent first, max 100)."""
    history = _load_history()
    return JSONResponse({"count": len(history), "scans": history})


# ─────────────────────────────────────────────────────────────────────
# POST /resend-alert
# ─────────────────────────────────────────────────────────────────────

@app.post("/resend-alert")
async def resend_alert(body: dict):
    """
    Re-send a Slack alert from a previous scan.
    Body: { "scan_id": "<timestamp string>" }
    """
    scan_id = body.get("scan_id")
    if not scan_id:
        raise HTTPException(status_code=400, detail="scan_id is required")

    history = _load_history()
    entry = next((s for s in history if s.get("id") == scan_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    slack_payload = entry.get("slack_payload")
    if not slack_payload:
        raise HTTPException(status_code=400, detail="No Slack payload stored for this scan")

    if not os.getenv("SLACK_WEBHOOK_URL"):
        raise HTTPException(status_code=503, detail="SLACK_WEBHOOK_URL not configured")

    try:
        from slack_integration import send_slack_alert
        sent = send_slack_alert(slack_payload)
        return JSONResponse({"sent": sent})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─────────────────────────────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "SupplyPulse API", "version": "1.0.0", "status": "running"}
