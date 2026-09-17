"""
Add 15 new products to the Notion Product Catalog.
Run once: python populate_notion.py
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["NOTION_API_KEY"]
RAW_DB_ID = os.environ["NOTION_DATABASE_ID"].replace("-", "").strip()
DB_ID = f"{RAW_DB_ID[0:8]}-{RAW_DB_ID[8:12]}-{RAW_DB_ID[12:16]}-{RAW_DB_ID[16:20]}-{RAW_DB_ID[20:32]}"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

NEW_PRODUCTS = [
    {"sku_id": "SKU_016", "product_name": "Eggo Homestyle Waffles",         "category": "Frozen",         "threshold": 8,  "cost": 1.80, "retail": 3.99, "lead": 3, "case": 12},
    {"sku_id": "SKU_017", "product_name": "Honey Bun Glazed Pastry",        "category": "Bakery",         "threshold": 10, "cost": 0.60, "retail": 1.49, "lead": 4, "case": 24},
    {"sku_id": "SKU_018", "product_name": "Chex Mix Original Snack",        "category": "Snacks",         "threshold": 8,  "cost": 1.40, "retail": 3.29, "lead": 3, "case": 12},
    {"sku_id": "SKU_019", "product_name": "Hamburger Helper Classic",       "category": "Dry Goods",      "threshold": 6,  "cost": 1.10, "retail": 2.49, "lead": 4, "case": 12},
    {"sku_id": "SKU_020", "product_name": "Hostess Powdered Donettes",      "category": "Bakery",         "threshold": 8,  "cost": 1.20, "retail": 2.99, "lead": 3, "case": 12},
    {"sku_id": "SKU_021", "product_name": "Little Debbie Oatmeal Pies",     "category": "Snacks",         "threshold": 8,  "cost": 1.00, "retail": 2.49, "lead": 3, "case": 12},
    {"sku_id": "SKU_022", "product_name": "Chips Ahoy Chocolate Chip Cookies","category": "Snacks",       "threshold": 6,  "cost": 1.90, "retail": 4.29, "lead": 3, "case": 12},
    {"sku_id": "SKU_023", "product_name": "Malt-O-Meal Cereal Bag",         "category": "Breakfast",      "threshold": 5,  "cost": 2.20, "retail": 4.99, "lead": 4, "case": 6},
    {"sku_id": "SKU_024", "product_name": "Honey Nut Cheerios Cereal",      "category": "Breakfast",      "threshold": 6,  "cost": 2.50, "retail": 5.49, "lead": 3, "case": 8},
    {"sku_id": "SKU_025", "product_name": "Vegetable Cooking Oil Bottle",   "category": "Cooking",        "threshold": 4,  "cost": 1.80, "retail": 3.99, "lead": 4, "case": 6},
    {"sku_id": "SKU_026", "product_name": "Hot Sauce Bottle",               "category": "Condiments",     "threshold": 6,  "cost": 0.90, "retail": 2.49, "lead": 4, "case": 12},
    {"sku_id": "SKU_027", "product_name": "Grape Jelly Jar",                "category": "Condiments",     "threshold": 5,  "cost": 1.30, "retail": 3.29, "lead": 4, "case": 6},
    {"sku_id": "SKU_028", "product_name": "Canned Green Beans",             "category": "Canned Goods",   "threshold": 10, "cost": 0.50, "retail": 1.29, "lead": 3, "case": 24},
    {"sku_id": "SKU_029", "product_name": "Hostess Twinkies Golden Cake",   "category": "Bakery",         "threshold": 8,  "cost": 1.20, "retail": 2.99, "lead": 3, "case": 12},
    {"sku_id": "SKU_030", "product_name": "Drake's Coffee Cakes",           "category": "Bakery",         "threshold": 6,  "cost": 1.30, "retail": 2.99, "lead": 3, "case": 12},
]


def create_page(product: dict) -> bool:
    body = {
        "parent": {"database_id": DB_ID},
        "properties": {
            "sku_id": {"title": [{"text": {"content": product["sku_id"]}}]},
            "product_name": {"rich_text": [{"text": {"content": product["product_name"]}}]},
            "category": {"select": {"name": product["category"]}},
            "minimum_safety_threshold": {"number": product["threshold"]},
            "cost_price_per_unit": {"number": product["cost"]},
            "retail_price_per_unit": {"number": product["retail"]},
            "typical_reorder_lead_time_days": {"number": product["lead"]},
            "reorder_unit_quantity": {"number": product["case"]},
        },
    }

    resp = requests.post(
        "https://api.notion.com/v1/pages",
        headers=HEADERS,
        json=body,
        timeout=10,
    )

    if resp.ok:
        return True
    else:
        print(f"  ❌ Failed: {resp.status_code} — {resp.text[:120]}")
        return False


if __name__ == "__main__":
    print(f"Adding {len(NEW_PRODUCTS)} products to Notion database {DB_ID[:8]}…\n")

    success = 0
    for p in NEW_PRODUCTS:
        ok = create_page(p)
        icon = "✅" if ok else "❌"
        print(f"  {icon}  {p['sku_id']} — {p['product_name']}")
        if ok:
            success += 1

    print(f"\nDone: {success}/{len(NEW_PRODUCTS)} added.")
