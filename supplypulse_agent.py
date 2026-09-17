"""
SupplyPulse Agent Engine
========================
Standalone AI pipeline for shelf inventory analysis.

Pipeline stages:
  1. analyze_shelf_image   — Claude Vision  → structured detection JSON
  2. match_to_catalog      — fuzzy SKU matching + low-confidence fallbacks
  3. calculate_reorder_plan— velocity/lead-time/seasonality math + urgency scoring
  4. build_slack_payload   — Slack Block Kit JSON with priority tiers & actions
  5. run_pipeline          — orchestrates 1→4, returns consolidated result
"""

from __future__ import annotations

import base64
import json
import logging
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────────────
# Bootstrap
# ─────────────────────────────────────────────────────────────────────
load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("supplypulse")


# ─────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────
# Cross-region inference profile for Claude 3.7 Sonnet on Bedrock.
# Override via BEDROCK_MODEL_ID env var if needed.
VISION_MODEL = os.getenv(
    "BEDROCK_MODEL_ID",
    "us.anthropic.claude-3-7-sonnet-20250219-v1:0",  # cross-region inference profile
)
VISION_MAX_TOKENS = 4096

VISION_SYSTEM_PROMPT = """\
You are a shelf inventory analyst for a small retail shop.

YOUR TASK:
1. Identify every distinct product/SKU visible on the shelves.
2. Count or estimate the quantity of each product.
3. Assign a confidence score (0.0–1.0) to each detection.
4. Flag items that are low-stock, out-of-stock, partially occluded, or unclear.

DETECTION RULES:
- Pay strict attention to text labels, color variations, and sub-branding
  to differentiate flavor or variant SKUs (e.g. "Red Bull Regular" vs
  "Red Bull Sugar-Free" are SEPARATE items).
- Partial occlusion (items hidden behind others): flag, confidence 0.3–0.6.
- Blurry or unreadable items: still attempt detection, mark low confidence.
- Empty shelf spaces with visible price tags: report quantity 0, status "out_of_stock".
- Low or uneven lighting: note it and lower confidence accordingly.

STATUS VALUES — pick exactly one per item:
  "in_stock"      — quantity comfortably above a reasonable minimum
  "low_stock"     — visually only a few units remain
  "out_of_stock"  — zero units visible or clearly empty slot
  "unclear"       — cannot confidently identify the product

OUTPUT — respond with ONLY valid JSON, no markdown fences, no preamble:
{
  "detection_summary": {
    "total_skus_identified": <int>,
    "scan_confidence": <float between 0.0 and 1.0>
  },
  "items": [
    {
      "sku_candidate": "<short identifier or descriptive slug>",
      "product_description": "<brand, variant, size as visible>",
      "estimated_quantity": <int or null if truly unknown>,
      "confidence": <float 0.0–1.0>,
      "status": "in_stock" | "low_stock" | "out_of_stock" | "unclear",
      "notes": "<any observations: occlusion, lighting, blur, etc.>"
    }
  ]
}"""


# ═════════════════════════════════════════════════════════════════════
# STEP 1 — Image Preprocessing & Claude Vision
# ═════════════════════════════════════════════════════════════════════

def _encode_image(image_path: str) -> tuple[str, str]:
    """Return (base64_data, media_type) for a local image file."""
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    if not path.is_file():
        raise ValueError(f"Path is not a file: {image_path}")

    ext = path.suffix.lower().lstrip(".")
    media_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "gif": "image/gif",
    }
    media_type = media_types.get(ext)
    if media_type is None:
        raise ValueError(
            f"Unsupported image format '.{ext}'. "
            f"Supported: {', '.join(media_types.keys())}"
        )

    data = base64.standard_b64encode(path.read_bytes()).decode("utf-8")
    return data, media_type


def analyze_shelf_image(image_path: str) -> dict[str, Any]:
    """
    Send a shelf photo to Claude Vision via boto3 bedrock-runtime and return
    structured detection JSON.

    Uses boto3 directly (not AnthropicBedrock SDK) so that inference profile
    IDs (us.anthropic.*) are routed correctly by Bedrock.

    Args:
        image_path: Local path to a shelf image (jpg/png/webp).

    Returns:
        Dict with keys ``detection_summary`` and ``items``.

    Raises:
        FileNotFoundError: Image file does not exist.
        ValueError: Unsupported format or unparseable response.
        botocore.exceptions.ClientError: Bedrock / auth failure.
    """
    logger.info("Encoding image: %s", image_path)
    image_b64, media_type = _encode_image(image_path)
    file_size_kb = len(image_b64) * 3 / 4 / 1024
    logger.info("Image encoded (≈%.0f KB, %s)", file_size_kb, media_type)

    # boto3 reads AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION from env
    client = boto3.client(
        "bedrock-runtime",
        region_name=os.environ["AWS_REGION"],
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

    # Bedrock expects the Anthropic Messages API format as the request body
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": VISION_MAX_TOKENS,
        "system": VISION_SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Analyze this shelf photo from a small convenience store. "
                            "Identify all visible products, estimate quantities, and "
                            "flag any low-stock items. Return ONLY valid JSON."
                        ),
                    },
                ],
            }
        ],
    }

    logger.info("Calling Claude Vision via Bedrock (%s) …", VISION_MODEL)
    response = client.invoke_model(
        modelId=VISION_MODEL,
        body=json.dumps(request_body),
        contentType="application/json",
        accept="application/json",
    )

    response_body = json.loads(response["body"].read())
    raw = response_body["content"][0]["text"].strip()
    logger.debug("Raw vision response (first 300 chars): %s", raw[:300])

    # Strip markdown code fences if the model wraps its output
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[: raw.rfind("```")]
        raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse vision JSON: %s", exc)
        raise ValueError(f"Claude returned non-JSON response: {raw[:200]}") from exc

    n_items = len(parsed.get("items", []))
    scan_conf = parsed.get("detection_summary", {}).get("scan_confidence", "?")
    logger.info("Vision complete — %d items detected (scan confidence: %s)", n_items, scan_conf)

    return parsed


# ═════════════════════════════════════════════════════════════════════
# STEP 2 — AI-Powered Catalog Matching & Low-Confidence Fallback
# ═════════════════════════════════════════════════════════════════════

MATCH_SYSTEM_PROMPT = """\
You are a product catalog matcher for a retail inventory system.

You will receive:
1. A list of items detected on a shelf by a vision model (with descriptions)
2. A product catalog database (with SKU IDs and product names)

Your job: match each detected item to the BEST catalog entry, or mark it "NONE" if nothing fits.

MATCHING RULES:
- Match based on product identity, not exact wording. "Cheez-It Original, red box" matches "Cheez-It Original Crackers".
- Different flavors/variants of the same brand ARE different products. "Cheez-It White Cheddar" ≠ "Cheez-It Original".
- Empty shelf spaces should NEVER match a catalog product — always "NONE".
- Generic descriptions like "canned goods" or "snack items" with no brand → "NONE".
- If a detected item could match multiple catalog entries, pick the closest one.
- Each detected item gets exactly one match or "NONE".

OUTPUT — respond with ONLY valid JSON, no markdown, no preamble:
[
  { "detected_index": 0, "matched_sku_id": "SKU_001" or "NONE", "match_reason": "brief reason" },
  { "detected_index": 1, "matched_sku_id": "NONE", "match_reason": "no catalog match for generic item" },
  ...
]"""


def _ai_match_items(
    vision_items: list[dict],
    catalog_db: dict[str, dict[str, Any]],
) -> dict[int, str]:
    """
    Use Claude to intelligently match detected items to catalog entries.
    Returns a dict mapping detected_index → matched_sku_id (or "NONE").
    """
    # Build catalog summary for the prompt
    catalog_lines = []
    for sku_id, product in catalog_db.items():
        catalog_lines.append(f"  {sku_id}: {product['product_name']}")
    catalog_text = "\n".join(catalog_lines)

    # Build detected items summary
    detected_lines = []
    for i, item in enumerate(vision_items):
        desc = item.get("product_description", "Unknown")
        conf = item.get("confidence", 0)
        status = item.get("status", "unclear")
        detected_lines.append(f"  [{i}] \"{desc}\" (confidence: {conf}, status: {status})")
    detected_text = "\n".join(detected_lines)

    user_prompt = (
        f"PRODUCT CATALOG ({len(catalog_db)} items):\n{catalog_text}\n\n"
        f"DETECTED SHELF ITEMS ({len(vision_items)} items):\n{detected_text}\n\n"
        f"Match each detected item to the best catalog SKU or NONE. Return ONLY valid JSON."
    )

    client = boto3.client(
        "bedrock-runtime",
        region_name=os.environ["AWS_REGION"],
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "system": MATCH_SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    logger.info("Calling Claude for AI-powered catalog matching …")
    response = client.invoke_model(
        modelId=VISION_MODEL,
        body=json.dumps(request_body),
        contentType="application/json",
        accept="application/json",
    )

    response_body = json.loads(response["body"].read())
    raw = response_body["content"][0]["text"].strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[: raw.rfind("```")]
        raw = raw.strip()

    try:
        matches = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("AI matcher returned invalid JSON, falling back to empty matches")
        return {}

    # Build index → sku_id mapping
    result: dict[int, str] = {}
    for m in matches:
        idx = m.get("detected_index")
        sku = m.get("matched_sku_id", "NONE")
        reason = m.get("match_reason", "")
        if idx is not None and sku != "NONE":
            result[idx] = sku
            logger.debug("AI match: [%d] → %s (%s)", idx, sku, reason)

    logger.info("AI matching complete: %d items matched to catalog", len(result))
    return result


def match_to_catalog(
    vision_output: dict[str, Any],
    catalog_db: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Match vision-detected items against the product catalog using Claude AI.

    Strategy:
      1. Items with confidence < 0.5 → skip, flag for manual review.
      2. Send all remaining items + full catalog to Claude in one call.
      3. Claude returns the best SKU match for each item (or NONE).
      4. Merge matched catalog data into the result.

    Low-confidence mitigation:
      - confidence < 0.5 → requires_manual_mapping = True
      - confidence 0.3–0.6 (partial occlusion) →
        effective_quantity = avg(vision_estimate, safety_threshold)
    """
    items = vision_output.get("items", [])
    results: list[dict[str, Any]] = []

    # Separate low-confidence items before AI matching
    matchable_indices: list[int] = []
    for i, item in enumerate(items):
        confidence = item.get("confidence", 0.0)
        if confidence < 0.5:
            # Too low — skip AI matching, flag directly
            results.append({
                "vision_description": item.get("product_description", ""),
                "vision_sku_candidate": item.get("sku_candidate", ""),
                "confidence": confidence,
                "visual_quantity": item.get("estimated_quantity"),
                "status": item.get("status", "unclear"),
                "notes": item.get("notes", ""),
                "matched": False,
                "requires_manual_mapping": True,
                "effective_quantity": item.get("estimated_quantity") or 0,
                "_original_index": i,
            })
        else:
            matchable_indices.append(i)

    # Run AI matching on all matchable items in one call
    matchable_items = [items[i] for i in matchable_indices]
    ai_matches: dict[int, str] = {}
    if matchable_items and catalog_db:
        try:
            # AI returns indices relative to the full items list
            ai_matches = _ai_match_items(items, catalog_db)
        except Exception as exc:
            logger.warning("AI matching failed, all items will need manual review: %s", exc)

    # Process matchable items with AI results
    for i in matchable_indices:
        item = items[i]
        description = item.get("product_description", "")
        confidence = item.get("confidence", 0.0)
        visual_qty = item.get("estimated_quantity")
        status = item.get("status", "unclear")
        notes = item.get("notes", "")

        entry: dict[str, Any] = {
            "vision_description": description,
            "vision_sku_candidate": item.get("sku_candidate", ""),
            "confidence": confidence,
            "visual_quantity": visual_qty,
            "status": status,
            "notes": notes,
            "matched": False,
            "requires_manual_mapping": False,
            "_original_index": i,
        }

        matched_sku_id = ai_matches.get(i)
        matched_product = catalog_db.get(matched_sku_id) if matched_sku_id else None

        if matched_product is None:
            entry["requires_manual_mapping"] = True
            entry["effective_quantity"] = visual_qty if visual_qty is not None else 0
            results.append(entry)
            continue

        # Successful match — merge catalog fields
        entry["matched"] = True
        entry["sku_id"] = matched_product["sku_id"]
        entry["product_name"] = matched_product["product_name"]
        entry["category"] = matched_product.get("category", "")
        entry["cost_price"] = matched_product["cost_price_per_unit"]
        entry["retail_price"] = matched_product["retail_price_per_unit"]
        entry["lead_time_days"] = matched_product["typical_reorder_lead_time_days"]
        entry["safety_threshold"] = matched_product["minimum_safety_threshold"]
        entry["reorder_unit_quantity"] = matched_product["reorder_unit_quantity"]

        # Occlusion adjustment (confidence 0.3–0.6)
        if 0.3 <= confidence <= 0.6 and visual_qty is not None:
            adjusted = round(
                (visual_qty + matched_product["minimum_safety_threshold"]) / 2
            )
            entry["effective_quantity"] = adjusted
            entry["notes"] += " [qty adjusted: occluded estimate averaged with safety threshold]"
        else:
            entry["effective_quantity"] = visual_qty if visual_qty is not None else 0

        results.append(entry)

    # Sort by original index to preserve order
    results.sort(key=lambda x: x.get("_original_index", 0))

    # Clean up internal field
    for r in results:
        r.pop("_original_index", None)

    n_matched = sum(1 for r in results if r["matched"])
    n_manual = sum(1 for r in results if r["requires_manual_mapping"])
    logger.info("Catalog matching: %d matched, %d need manual review", n_matched, n_manual)

    return results


# ═════════════════════════════════════════════════════════════════════
# STEP 3 — Reorder Math Engine
# ═════════════════════════════════════════════════════════════════════

def calculate_reorder_plan(
    matched_items: list[dict[str, Any]],
    sales_data: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """
    Calculate reorder quantities and urgency scores.

    Formulas:
      Suggested_Qty = (velocity × lead_time × seasonality) + safety − visual_stock
        → rounded UP to nearest ``reorder_unit_quantity`` (case size)

      Urgency_Score (0–100):
        stockout_risk  = (1 − min(1, visual / (velocity×2))) × 40
        margin_loss    = ((retail − cost) / retail)           × 35
        lead_time_wt   = min(1, lead_time / 14)               × 25
        total          = stockout + margin + lead
        if confidence < 0.75 → total × 0.7

    Returns:
      {
        "items": [...sorted by urgency desc...],
        "total_restock_cost": float,
        "items_to_reorder": int,
        "items_manual_review": int,
      }
    """
    plan_items: list[dict[str, Any]] = []
    total_cost = 0.0
    reorder_count = 0
    manual_count = 0

    for item in matched_items:
        # ── Unmatched items pass through with zeroed fields ──
        if not item.get("matched", False):
            manual_count += 1
            plan_items.append({
                **item,
                "suggested_qty": 0,
                "estimated_cost": 0.0,
                "urgency_score": 0.0,
                "urgency_label": "MANUAL REVIEW",
            })
            continue

        sku_id: str = item["sku_id"]
        velocity_record = sales_data.get(sku_id, {})
        daily_velocity: float = velocity_record.get("avg_daily_velocity", 0.5)
        seasonality: float = velocity_record.get("seasonality_factor", 1.0)

        lead_time: int = item["lead_time_days"]
        safety: int = item["safety_threshold"]
        visual_stock: int = item["effective_quantity"]
        cost_price: float = item["cost_price"]
        retail_price: float = item["retail_price"]
        case_size: int = item["reorder_unit_quantity"]
        confidence: float = item["confidence"]

        # ── Suggested reorder quantity ──
        raw_qty = (daily_velocity * lead_time * seasonality) + safety - visual_stock
        raw_qty = max(0.0, raw_qty)

        if raw_qty > 0:
            suggested_qty = math.ceil(raw_qty / case_size) * case_size
        else:
            suggested_qty = 0

        estimated_cost = round(suggested_qty * cost_price, 2)

        # ── Urgency score ──
        # Stockout risk (inverted: less stock → higher score)
        if daily_velocity > 0:
            days_of_stock = visual_stock / daily_velocity
            stockout_ratio = min(1.0, visual_stock / (daily_velocity * 2))
            stockout_risk = (1.0 - stockout_ratio) * 40
        else:
            days_of_stock = float("inf")
            stockout_risk = 0.0

        # Margin loss opportunity
        margin = (retail_price - cost_price) / retail_price if retail_price > 0 else 0.0
        margin_loss = margin * 35

        # Lead time weight (longer lead → more urgent to order now)
        lead_weight = min(1.0, lead_time / 14) * 25

        urgency_score = stockout_risk + margin_loss + lead_weight

        # Confidence penalty
        if confidence < 0.75:
            urgency_score *= 0.7

        urgency_score = round(min(100.0, max(0.0, urgency_score)), 1)

        # Label
        if urgency_score >= 65:
            urgency_label = "URGENT"
        elif urgency_score >= 40:
            urgency_label = "HIGH"
        else:
            urgency_label = "MEDIUM"

        if suggested_qty > 0:
            reorder_count += 1
            total_cost += estimated_cost

        plan_items.append({
            **item,
            "daily_velocity": daily_velocity,
            "seasonality_factor": seasonality,
            "days_of_stock_remaining": round(days_of_stock, 1) if days_of_stock != float("inf") else None,
            "raw_reorder_qty": round(raw_qty, 2),
            "suggested_qty": suggested_qty,
            "estimated_cost": estimated_cost,
            "urgency_score": urgency_score,
            "urgency_label": urgency_label,
        })

    # Sort by urgency descending
    plan_items.sort(key=lambda x: x.get("urgency_score", 0), reverse=True)

    total_cost = round(total_cost, 2)
    logger.info(
        "Reorder plan: %d items to reorder, %d manual review, total cost $%.2f",
        reorder_count, manual_count, total_cost,
    )

    return {
        "items": plan_items,
        "total_restock_cost": total_cost,
        "items_to_reorder": reorder_count,
        "items_manual_review": manual_count,
    }


# ═════════════════════════════════════════════════════════════════════
# STEP 4 — Slack Block Kit Payload Generator
# ═════════════════════════════════════════════════════════════════════

def build_slack_payload(
    reorder_plan: dict[str, Any],
    shop_name: str = "Main St Convenience",
) -> dict[str, Any]:
    """
    Build a Slack Block Kit message from the reorder plan.

    Sections:
      - Header with scan timestamp
      - Summary stats
      - Priority-tiered item list (🔴 🟡 🟢 ⚪)
      - Total estimated cost
      - Action buttons (Approve All, View Sheet, Dismiss)
    """
    now = datetime.now(timezone.utc).strftime("%b %d, %Y — %I:%M %p UTC")
    plan_items = reorder_plan["items"]
    total_cost = reorder_plan["total_restock_cost"]
    n_reorder = reorder_plan["items_to_reorder"]
    n_manual = reorder_plan["items_manual_review"]

    # ── Partition by tier ──
    tiers: dict[str, list[dict]] = {
        "URGENT": [],
        "HIGH": [],
        "MEDIUM": [],
        "MANUAL REVIEW": [],
    }
    for item in plan_items:
        label = item.get("urgency_label", "MEDIUM")
        tiers.setdefault(label, []).append(item)

    # ── Format tier text ──
    tier_config = [
        ("🔴", "URGENT — Order Today", "URGENT"),
        ("🟡", "HIGH PRIORITY — Order This Week", "HIGH"),
        ("🟢", "MEDIUM — Monitor", "MEDIUM"),
        ("⚪", "MANUAL REVIEW NEEDED", "MANUAL REVIEW"),
    ]

    priority_lines: list[str] = []
    for emoji, heading, key in tier_config:
        items_in_tier = tiers.get(key, [])
        if not items_in_tier:
            continue
        priority_lines.append(f"{emoji} *{heading}:*")
        for it in items_in_tier:
            name = it.get("product_name", it.get("vision_description", "Unknown"))
            if it.get("requires_manual_mapping"):
                priority_lines.append(
                    f"  • {name} — ⚠️ Needs manual mapping "
                    f"(confidence: {it['confidence']:.0%})"
                )
            elif it.get("suggested_qty", 0) > 0:
                priority_lines.append(
                    f"  • {name} — {it['effective_quantity']} on shelf → "
                    f"Order *{it['suggested_qty']}* units | "
                    f"*${it['estimated_cost']:.2f}* | "
                    f"{it['lead_time_days']}d lead time"
                )
            else:
                priority_lines.append(
                    f"  • {name} — Stock OK ({it['effective_quantity']} units)"
                )
        priority_lines.append("")  # blank line between tiers

    priority_text = "\n".join(priority_lines).strip() or "_All items well-stocked._"

    # ── Assemble blocks ──
    blocks: list[dict[str, Any]] = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📦 SupplyPulse: Restock Alert",
                "emoji": True,
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"*Shop:* {shop_name}\n"
                    f"*Scan Time:* {now}\n"
                    f"*Items to Reorder:* {n_reorder} SKUs\n"
                    f"*Needs Manual Review:* {n_manual} SKUs"
                ),
            },
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": priority_text},
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"💰 *Estimated Total Restock Cost:* *${total_cost:.2f}*",
            },
        },
        {"type": "divider"},
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "✅ Approve All Orders",
                        "emoji": True,
                    },
                    "value": "approve_all",
                    "action_id": "supplypulse_approve_all",
                    "style": "primary",
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "📋 View Sheet",
                        "emoji": True,
                    },
                    "value": "view_sheet",
                    "action_id": "supplypulse_view_sheet",
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "❌ Dismiss",
                        "emoji": True,
                    },
                    "value": "dismiss",
                    "action_id": "supplypulse_dismiss",
                    "style": "danger",
                },
            ],
        },
    ]

    logger.info("Slack payload built (%d blocks)", len(blocks))
    return {"blocks": blocks}


# ═════════════════════════════════════════════════════════════════════
# PIPELINE ORCHESTRATOR
# ═════════════════════════════════════════════════════════════════════

def run_pipeline(
    image_path: str,
    catalog_db: dict[str, dict[str, Any]] | None = None,
    sales_db: dict[str, dict[str, Any]] | None = None,
    shop_name: str = "Main St Convenience",
    use_live: bool = True,
) -> dict[str, Any]:
    """
    Execute the full SupplyPulse agent pipeline end-to-end.

    When ``use_live=True`` (default), the pipeline connects to real
    Notion, Google Sheets, and Slack APIs.  If any integration env var
    is missing, it falls back to the provided ``catalog_db`` / ``sales_db``
    dicts (or the mock data from ``mock_data.py``).

    Args:
        image_path:  Path to a local shelf image.
        catalog_db:  Fallback product catalog dict (used if Notion unavailable).
        sales_db:    Fallback sales velocity dict (used if Sheets unavailable).
        shop_name:   Display name for the Slack alert.
        use_live:    If True, attempt real API integrations.

    Returns:
        Consolidated dict with all intermediate and final outputs.
    """
    started = datetime.now(timezone.utc)

    print()
    print("═" * 60)
    print("  ⚡  SupplyPulse Agent — Pipeline Start")
    print("═" * 60)

    # ── Step 1: Claude Vision ──
    print("\n  [1/6]  Analyzing shelf image with Claude Vision …")
    vision_result = analyze_shelf_image(image_path)
    det = vision_result.get("detection_summary", {})
    n_detected = det.get("total_skus_identified", len(vision_result.get("items", [])))
    scan_conf = det.get("scan_confidence", "N/A")
    print(f"         → {n_detected} SKUs detected (scan confidence: {scan_conf})")

    # ── Step 2: Fetch catalog from Notion (or fallback) ──
    notion_live = False
    if use_live and os.getenv("NOTION_API_KEY") and os.getenv("NOTION_DATABASE_ID"):
        print("\n  [2/6]  Fetching product catalog from Notion …")
        try:
            from notion_integration import fetch_notion_catalog
            catalog_db = fetch_notion_catalog()
            notion_live = True
            print(f"         → {len(catalog_db)} SKUs loaded from Notion")
        except Exception as exc:
            logger.warning("Notion fetch failed, using fallback: %s", exc)
            print(f"         → Notion failed ({exc}), using local fallback")
    else:
        print("\n  [2/6]  Using local product catalog (Notion not configured) …")

    if catalog_db is None:
        from mock_data import MOCK_NOTION_CATALOG
        catalog_db = MOCK_NOTION_CATALOG
        print(f"         → {len(catalog_db)} SKUs from mock data")

    # ── Step 3: Fetch sales velocity from Google Sheets (or fallback) ──
    sheets_live = False
    if use_live and os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE") and os.getenv("GOOGLE_SHEET_ID"):
        print("\n  [3/6]  Fetching sales velocity from Google Sheets …")
        try:
            from sheets_integration import fetch_sales_velocity
            sales_db = fetch_sales_velocity()
            sheets_live = True
            print(f"         → {len(sales_db)} SKUs loaded from Sheets")
        except Exception as exc:
            logger.warning("Sheets fetch failed, using fallback: %s", exc)
            print(f"         → Sheets failed ({exc}), using local fallback")
    else:
        print("\n  [3/6]  Using local sales data (Google Sheets not configured) …")

    if sales_db is None:
        from mock_data import MOCK_SALES_VELOCITY
        sales_db = MOCK_SALES_VELOCITY
        print(f"         → {len(sales_db)} SKUs from mock data")

    # ── Step 4: Catalog matching ──
    print("\n  [4/6]  Matching vision results against catalog …")
    matched_items = match_to_catalog(vision_result, catalog_db)
    n_matched = sum(1 for m in matched_items if m["matched"])
    n_manual = sum(1 for m in matched_items if m["requires_manual_mapping"])
    print(f"         → {n_matched} matched, {n_manual} need manual review")

    # ── Step 5: Reorder math ──
    print("\n  [5/6]  Calculating reorder quantities & urgency scores …")
    reorder_plan = calculate_reorder_plan(matched_items, sales_db)
    print(
        f"         → {reorder_plan['items_to_reorder']} items to reorder | "
        f"Est. cost: ${reorder_plan['total_restock_cost']:.2f}"
    )

    # ── Step 5b: Write reorder output to Google Sheets ──
    sheet_url = None
    if sheets_live:
        print("         → Writing reorder output to Google Sheets …")
        try:
            from sheets_integration import write_reorder_to_sheet
            sheet_url = write_reorder_to_sheet(reorder_plan, shop_name=shop_name)
            print(f"         → Sheet updated: {sheet_url}")
        except Exception as exc:
            logger.warning("Sheets write failed: %s", exc)
            print(f"         → Sheets write failed ({exc})")

    # ── Step 6: Build & send Slack alert ──
    print("\n  [6/6]  Generating Slack alert …")
    slack_payload = build_slack_payload(reorder_plan, shop_name=shop_name)
    print(f"         → Payload ready ({len(slack_payload['blocks'])} blocks)")

    slack_sent = False
    if use_live and os.getenv("SLACK_WEBHOOK_URL"):
        print("         → Sending to Slack …")
        try:
            from slack_integration import send_slack_alert
            slack_sent = send_slack_alert(slack_payload)
            status = "delivered ✓" if slack_sent else "failed ✗"
            print(f"         → Slack alert {status}")
        except Exception as exc:
            logger.warning("Slack send failed: %s", exc)
            print(f"         → Slack send failed ({exc})")
    else:
        print("         → Slack not configured, payload saved locally only")

    elapsed = (datetime.now(timezone.utc) - started).total_seconds()

    print()
    print("═" * 60)
    print(f"  ✅  Pipeline complete in {elapsed:.1f}s")
    print("═" * 60)

    # Integration status summary
    integrations = {
        "claude_vision": True,
        "notion": notion_live,
        "google_sheets_read": sheets_live,
        "google_sheets_write": sheet_url is not None,
        "slack": slack_sent,
    }
    active = sum(1 for v in integrations.values() if v)
    print(f"\n  📡  Live integrations: {active}/5 active")
    for name, status in integrations.items():
        icon = "✅" if status else "⬜"
        print(f"      {icon}  {name}")

    return {
        "vision_result": vision_result,
        "matched_items": matched_items,
        "reorder_plan": reorder_plan,
        "slack_payload": slack_payload,
        "integrations": integrations,
        "sheet_url": sheet_url,
        "summary": {
            "skus_detected": n_detected,
            "skus_matched": n_matched,
            "skus_manual_review": n_manual,
            "items_to_reorder": reorder_plan["items_to_reorder"],
            "total_estimated_cost": reorder_plan["total_restock_cost"],
            "pipeline_duration_seconds": round(elapsed, 2),
        },
        "timestamp": started.isoformat(),
    }