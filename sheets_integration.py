"""
SupplyPulse — Google Sheets Integration
=========================================
Reads sales velocity data from a live Google Sheet and writes
the reorder output back to a dedicated output sheet.

Required env vars:
  GOOGLE_SHEETS_CREDENTIALS_FILE  — path to service-account JSON key
  GOOGLE_SHEET_ID                 — the spreadsheet ID (from the URL)

Expected sheet tabs:
  "SalesVelocity"  — columns: sku_id | avg_daily_velocity | seasonality_factor | trend
  "ReorderOutput"  — auto-created/appended by the agent
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

import gspread
from google.oauth2.service_account import Credentials

logger = logging.getLogger("supplypulse.sheets")

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def _get_client() -> gspread.Client:
    """Authenticate and return a gspread client using service-account creds.
    
    Supports two modes:
      - Local: GOOGLE_SHEETS_CREDENTIALS_FILE path to JSON key file
      - Render/cloud: GOOGLE_SHEETS_CREDENTIALS_JSON with the JSON content directly
    """
    import json as _json

    creds_json_str = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON")
    creds_file = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_FILE")

    if creds_json_str:
        # Cloud mode: JSON content stored directly in env var
        creds_info = _json.loads(creds_json_str)
        creds = Credentials.from_service_account_info(creds_info, scopes=SCOPES)
    elif creds_file:
        # Local mode: path to JSON file
        creds = Credentials.from_service_account_file(creds_file, scopes=SCOPES)
    else:
        raise ValueError(
            "Neither GOOGLE_SHEETS_CREDENTIALS_JSON nor "
            "GOOGLE_SHEETS_CREDENTIALS_FILE is set."
        )

    return gspread.authorize(creds)


# ─────────────────────────────────────────────────────────────────────
# READ: Sales Velocity
# ─────────────────────────────────────────────────────────────────────

def fetch_sales_velocity() -> dict[str, dict[str, Any]]:
    """
    Read the SalesVelocity tab and return a dict keyed by sku_id.

    Expected columns (row 1 = headers):
      sku_id | avg_daily_velocity | seasonality_factor | trend

    Returns:
        { "SKU_001": { "avg_daily_velocity": 2.1, "seasonality_factor": 0.95, "trend": "increasing" }, ... }
    """
    sheet_id = os.environ["GOOGLE_SHEET_ID"]
    gc = _get_client()

    logger.info("Opening Google Sheet %s …", sheet_id[:12])
    spreadsheet = gc.open_by_key(sheet_id)
    worksheet = spreadsheet.worksheet("SalesVelocity")

    rows = worksheet.get_all_records()  # list of dicts keyed by header row
    velocity: dict[str, dict[str, Any]] = {}

    for row in rows:
        sku = str(row.get("sku_id", "")).strip()
        if not sku:
            continue
        velocity[sku] = {
            "avg_daily_velocity": float(row.get("avg_daily_velocity", 0.5)),
            "seasonality_factor": float(row.get("seasonality_factor", 1.0)),
            "trend": str(row.get("trend", "stable")),
        }

    logger.info("Sales velocity loaded: %d SKUs", len(velocity))
    return velocity


# ─────────────────────────────────────────────────────────────────────
# WRITE: Reorder Output
# ─────────────────────────────────────────────────────────────────────

def write_reorder_to_sheet(reorder_plan: dict[str, Any], shop_name: str = "Main St Convenience") -> str:
    """
    Append the reorder plan to the ReorderOutput tab.
    Creates the tab + headers if it doesn't exist.

    Args:
        reorder_plan: The dict returned by calculate_reorder_plan().
        shop_name: Shop identifier for the output rows.

    Returns:
        URL of the spreadsheet for linking in Slack.
    """
    sheet_id = os.environ["GOOGLE_SHEET_ID"]
    gc = _get_client()
    spreadsheet = gc.open_by_key(sheet_id)

    # Get or create the ReorderOutput tab
    try:
        worksheet = spreadsheet.worksheet("ReorderOutput")
    except gspread.exceptions.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(title="ReorderOutput", rows=200, cols=12)
        headers = [
            "Timestamp", "Shop", "SKU", "Product", "Visual_Stock",
            "Suggested_Qty", "Est_Cost", "Lead_Days",
            "Urgency_Score", "Urgency_Label", "Confidence", "Status",
        ]
        worksheet.append_row(headers, value_input_option="RAW")
        logger.info("Created ReorderOutput tab with headers")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    rows_to_append: list[list[Any]] = []

    for item in reorder_plan.get("items", []):
        name = item.get("product_name", item.get("vision_description", "Unknown"))
        rows_to_append.append([
            now,
            shop_name,
            item.get("sku_id", "UNMATCHED"),
            name,
            item.get("effective_quantity", "?"),
            item.get("suggested_qty", 0),
            item.get("estimated_cost", 0),
            item.get("lead_time_days", ""),
            item.get("urgency_score", 0),
            item.get("urgency_label", "N/A"),
            item.get("confidence", 0),
            item.get("status", ""),
        ])

    if rows_to_append:
        worksheet.append_rows(rows_to_append, value_input_option="USER_ENTERED")

    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}"
    logger.info("Wrote %d rows to ReorderOutput tab", len(rows_to_append))
    return sheet_url
