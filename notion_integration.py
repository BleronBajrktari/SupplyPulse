"""
SupplyPulse — Notion Integration
==================================
Fetches the product catalog from a live Notion database.
Uses raw HTTP requests to avoid notion-client SDK version issues.

Required env vars:
  NOTION_API_KEY       — Internal integration token (starts with ntn_)
  NOTION_DATABASE_ID   — ID of the Product Catalog database (with or without dashes)
"""

from __future__ import annotations

import logging
import os
from typing import Any

import requests

logger = logging.getLogger("supplypulse.notion")

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


def _format_database_id(raw_id: str) -> str:
    """Convert 32-char hex to hyphenated UUID format if needed."""
    clean = raw_id.replace("-", "").strip()
    if len(clean) != 32:
        return raw_id
    return f"{clean[0:8]}-{clean[8:12]}-{clean[12:16]}-{clean[16:20]}-{clean[20:32]}"


def _extract_text(prop: dict) -> str:
    prop_type = prop.get("type", "")
    if prop_type == "title":
        parts = prop.get("title", [])
    elif prop_type == "rich_text":
        parts = prop.get("rich_text", [])
    else:
        return ""
    return "".join(p.get("plain_text", "") for p in parts)


def _extract_number(prop: dict) -> float:
    return prop.get("number") or 0


def _extract_select(prop: dict) -> str:
    sel = prop.get("select")
    return sel.get("name", "") if sel else ""


def fetch_notion_catalog() -> dict[str, dict[str, Any]]:
    """
    Query the Notion Product Catalog database via raw HTTP and return
    a dict keyed by sku_id.
    """
    api_key = os.environ["NOTION_API_KEY"]
    database_id = _format_database_id(os.environ["NOTION_DATABASE_ID"])

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }

    logger.info("Querying Notion database %s …", database_id[:8])

    catalog: dict[str, dict[str, Any]] = {}
    has_more = True
    start_cursor = None

    while has_more:
        body: dict[str, Any] = {"page_size": 100}
        if start_cursor:
            body["start_cursor"] = start_cursor

        url = f"{NOTION_API_BASE}/databases/{database_id}/query"
        response = requests.post(url, headers=headers, json=body, timeout=15)

        if not response.ok:
            raise RuntimeError(
                f"Notion API error {response.status_code}: {response.text[:300]}"
            )

        data = response.json()

        for page in data.get("results", []):
            props = page.get("properties", {})
            sku_id = _extract_text(props.get("sku_id", {})).strip()
            if not sku_id:
                continue

            catalog[sku_id] = {
                "sku_id": sku_id,
                "product_name": _extract_text(props.get("product_name", {})),
                "category": _extract_select(props.get("category", {})),
                "minimum_safety_threshold": int(_extract_number(props.get("minimum_safety_threshold", {}))),
                "cost_price_per_unit": float(_extract_number(props.get("cost_price_per_unit", {}))),
                "retail_price_per_unit": float(_extract_number(props.get("retail_price_per_unit", {}))),
                "typical_reorder_lead_time_days": int(_extract_number(props.get("typical_reorder_lead_time_days", {}))),
                "reorder_unit_quantity": int(_extract_number(props.get("reorder_unit_quantity", {}))),
            }

        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    logger.info("Notion catalog loaded: %d SKUs", len(catalog))
    return catalog