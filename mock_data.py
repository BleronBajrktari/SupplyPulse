"""
SupplyPulse — Mock Data Layer
==============================
Simulates the two external data sources the agent reads from:

  1. MOCK_NOTION_CATALOG  — Product catalog (would live in Notion DB)
  2. MOCK_SALES_VELOCITY  — 90-day sales velocity + seasonality (would live in Google Sheets)

Each SKU entry is keyed by a stable `sku_id` string.  The agent's
catalog-matching step resolves Claude Vision's free-text descriptions
to these canonical IDs.
"""

from typing import Any

# ─────────────────────────────────────────────────────────────────────
# Notion Product Catalog
# ─────────────────────────────────────────────────────────────────────
# Fields mirror the Notion DB schema from the technical spec:
#   sku_id, product_name, category, minimum_safety_threshold,
#   cost_price_per_unit, retail_price_per_unit,
#   typical_reorder_lead_time_days, reorder_unit_quantity

MOCK_NOTION_CATALOG: dict[str, dict[str, Any]] = {
    "SKU_001": {
        "sku_id": "SKU_001",
        "product_name": "Cheez-It Original Crackers",
        "category": "Snacks",
        "minimum_safety_threshold": 6,
        "cost_price_per_unit": 2.10,
        "retail_price_per_unit": 4.99,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_002": {
        "sku_id": "SKU_002",
        "product_name": "Cheez-It Crackers red box",
        "category": "Snacks",
        "minimum_safety_threshold": 5,
        "cost_price_per_unit": 2.10,
        "retail_price_per_unit": 4.99,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_003": {
        "sku_id": "SKU_003",
        "product_name": "Honey Maid Graham Crackers",
        "category": "Snacks",
        "minimum_safety_threshold": 5,
        "cost_price_per_unit": 1.80,
        "retail_price_per_unit": 3.99,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_004": {
        "sku_id": "SKU_004",
        "product_name": "Club Crackers",
        "category": "Snacks",
        "minimum_safety_threshold": 5,
        "cost_price_per_unit": 1.75,
        "retail_price_per_unit": 3.79,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_005": {
        "sku_id": "SKU_005",
        "product_name": "Hostess Cupcakes chocolate",
        "category": "Bakery & Snack Cakes",
        "minimum_safety_threshold": 6,
        "cost_price_per_unit": 1.20,
        "retail_price_per_unit": 2.99,
        "typical_reorder_lead_time_days": 2,
        "reorder_unit_quantity": 12,
    },
    "SKU_006": {
        "sku_id": "SKU_006",
        "product_name": "Hostess Cupcakes variety",
        "category": "Bakery & Snack Cakes",
        "minimum_safety_threshold": 6,
        "cost_price_per_unit": 1.20,
        "retail_price_per_unit": 2.99,
        "typical_reorder_lead_time_days": 2,
        "reorder_unit_quantity": 12,
    },
    "SKU_007": {
        "sku_id": "SKU_007",
        "product_name": "Hostess Donettes chocolate",
        "category": "Bakery & Snack Cakes",
        "minimum_safety_threshold": 6,
        "cost_price_per_unit": 1.10,
        "retail_price_per_unit": 2.79,
        "typical_reorder_lead_time_days": 2,
        "reorder_unit_quantity": 12,
    },
    "SKU_008": {
        "sku_id": "SKU_008",
        "product_name": "Entenmanns donuts pastries",
        "category": "Bakery & Snack Cakes",
        "minimum_safety_threshold": 4,
        "cost_price_per_unit": 2.50,
        "retail_price_per_unit": 5.99,
        "typical_reorder_lead_time_days": 2,
        "reorder_unit_quantity": 6,
    },
    "SKU_009": {
        "sku_id": "SKU_009",
        "product_name": "Lay's chips yellow packaging",
        "category": "Snacks",
        "minimum_safety_threshold": 8,
        "cost_price_per_unit": 0.90,
        "retail_price_per_unit": 2.99,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_010": {
        "sku_id": "SKU_010",
        "product_name": "Sandwich cookies brown packaging",
        "category": "Snacks",
        "minimum_safety_threshold": 5,
        "cost_price_per_unit": 1.50,
        "retail_price_per_unit": 3.49,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_011": {
        "sku_id": "SKU_011",
        "product_name": "Pasta boxes yellow orange packaging",
        "category": "Dry Goods",
        "minimum_safety_threshold": 5,
        "cost_price_per_unit": 0.85,
        "retail_price_per_unit": 2.49,
        "typical_reorder_lead_time_days": 4,
        "reorder_unit_quantity": 12,
    },
    "SKU_012": {
        "sku_id": "SKU_012",
        "product_name": "Juice bottles variety red yellow orange",
        "category": "Beverages",
        "minimum_safety_threshold": 8,
        "cost_price_per_unit": 1.10,
        "retail_price_per_unit": 2.99,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_013": {
        "sku_id": "SKU_013",
        "product_name": "Condiments sauces bottles",
        "category": "Condiments",
        "minimum_safety_threshold": 4,
        "cost_price_per_unit": 1.30,
        "retail_price_per_unit": 3.29,
        "typical_reorder_lead_time_days": 4,
        "reorder_unit_quantity": 6,
    },
    "SKU_014": {
        "sku_id": "SKU_014",
        "product_name": "Cookies blue packaging",
        "category": "Snacks",
        "minimum_safety_threshold": 5,
        "cost_price_per_unit": 1.60,
        "retail_price_per_unit": 3.79,
        "typical_reorder_lead_time_days": 3,
        "reorder_unit_quantity": 12,
    },
    "SKU_015": {
        "sku_id": "SKU_015",
        "product_name": "Snack cakes white colored boxes",
        "category": "Bakery & Snack Cakes",
        "minimum_safety_threshold": 6,
        "cost_price_per_unit": 1.20,
        "retail_price_per_unit": 2.99,
        "typical_reorder_lead_time_days": 2,
        "reorder_unit_quantity": 12,
    },
}


# ─────────────────────────────────────────────────────────────────────
# Google Sheets — Sales Velocity & Seasonality
# ─────────────────────────────────────────────────────────────────────
# avg_daily_velocity  = units sold per day (90-day rolling average)
# seasonality_factor  = multiplier for the current month (1.0 = baseline)
# trend               = directional indicator for dashboard display

MOCK_SALES_VELOCITY: dict[str, dict[str, Any]] = {
    "SKU_001": {"avg_daily_velocity": 3.20, "seasonality_factor": 0.95, "trend": "increasing"},   # Cheez-It Original
    "SKU_002": {"avg_daily_velocity": 2.10, "seasonality_factor": 0.95, "trend": "stable"},       # Cheez-It red box
    "SKU_003": {"avg_daily_velocity": 1.80, "seasonality_factor": 0.95, "trend": "stable"},       # Honey Maid
    "SKU_004": {"avg_daily_velocity": 1.50, "seasonality_factor": 0.90, "trend": "stable"},       # Club Crackers
    "SKU_005": {"avg_daily_velocity": 2.80, "seasonality_factor": 1.00, "trend": "increasing"},   # Hostess Cupcakes choc
    "SKU_006": {"avg_daily_velocity": 2.40, "seasonality_factor": 1.00, "trend": "stable"},       # Hostess Cupcakes variety
    "SKU_007": {"avg_daily_velocity": 2.60, "seasonality_factor": 1.00, "trend": "stable"},       # Hostess Donettes
    "SKU_008": {"avg_daily_velocity": 1.20, "seasonality_factor": 0.95, "trend": "stable"},       # Entenmanns
    "SKU_009": {"avg_daily_velocity": 2.20, "seasonality_factor": 0.95, "trend": "decreasing"},   # Lay's chips
    "SKU_010": {"avg_daily_velocity": 1.60, "seasonality_factor": 1.00, "trend": "stable"},       # Sandwich cookies
    "SKU_011": {"avg_daily_velocity": 1.30, "seasonality_factor": 0.90, "trend": "stable"},       # Pasta boxes
    "SKU_012": {"avg_daily_velocity": 2.50, "seasonality_factor": 1.05, "trend": "increasing"},   # Juice bottles
    "SKU_013": {"avg_daily_velocity": 0.80, "seasonality_factor": 0.90, "trend": "stable"},       # Condiments
    "SKU_014": {"avg_daily_velocity": 1.70, "seasonality_factor": 1.00, "trend": "stable"},       # Cookies blue
    "SKU_015": {"avg_daily_velocity": 2.30, "seasonality_factor": 1.00, "trend": "stable"},       # Snack cakes
}
