#!/usr/bin/env python3
"""
SupplyPulse Agent — CLI Test Runner
=====================================
Runs the full agent pipeline on a shelf image with live integrations.
Falls back to mock data for any integration not configured in .env.

Usage:
    python test_agent.py                          # default: data/shelf_photo.jpg
    python test_agent.py path/to/shelf_image.jpg  # custom image
    python test_agent.py --mock                   # force all-mock mode
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from supplypulse_agent import run_pipeline


def _section(title: str) -> None:
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}\n")


def _save_output(result: dict, path: str = "logs/last_pipeline_run.json") -> None:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n📁  Full output saved → {out}")


def main() -> None:
    # Parse args
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    use_live = "--mock" not in flags

    image_path = args[0] if args else "data/shelf_photo.jpg"
    if not args:
        print(f"No image argument provided — using default: {image_path}")
        print("Tip: python test_agent.py <path_to_image>\n")

    if not Path(image_path).exists():
        print(f"❌  File not found: {image_path}")
        print("   Drop a shelf photo into data/ or pass a path as an argument.")
        sys.exit(1)

    if not use_live:
        print("🔧  Running in MOCK mode (--mock flag detected)\n")

    # Run pipeline — it auto-detects which integrations are configured
    result = run_pipeline(
        image_path=image_path,
        shop_name="Main St Convenience",
        use_live=use_live,
    )

    # ── Vision output ──
    _section("RAW VISION OUTPUT")
    print(json.dumps(result["vision_result"], indent=2))

    # ── Catalog matching ──
    _section("CATALOG MATCHING RESULTS")
    for item in result["matched_items"]:
        icon = "✅" if item["matched"] else "⚠️"
        name = item.get("product_name", item.get("vision_description", "Unknown"))
        print(f"  {icon}  {name}")
        print(
            f"      Confidence: {item['confidence']:.0%}  |  "
            f"Visual Qty: {item['visual_quantity']}  |  "
            f"Effective Qty: {item['effective_quantity']}"
        )
        if item["requires_manual_mapping"]:
            print("      ⚠  REQUIRES MANUAL MAPPING")
        if item.get("notes"):
            print(f"      Notes: {item['notes']}")
        print()

    # ── Reorder plan table ──
    _section("REORDER PLAN (sorted by urgency)")
    header = (
        f"  {'Product':<32} {'Shelf':>5} {'Order':>6} "
        f"{'Cost':>9} {'Score':>6}  Label"
    )
    print(header)
    print(f"  {'─' * 32} {'─' * 5} {'─' * 6} {'─' * 9} {'─' * 6}  {'─' * 13}")
    for item in result["reorder_plan"]["items"]:
        name = item.get("product_name", item.get("vision_description", "Unknown"))
        name = (name[:30] + "…") if len(name) > 31 else name
        shelf = item.get("effective_quantity", "?")
        order = item.get("suggested_qty", 0)
        cost = item.get("estimated_cost", 0.0)
        score = item.get("urgency_score", 0.0)
        label = item.get("urgency_label", "N/A")
        print(
            f"  {name:<32} {str(shelf):>5} {order:>6} "
            f"${cost:>8.2f} {score:>6.1f}  {label}"
        )

    # ── Cost summary ──
    _section("COST SUMMARY")
    s = result["summary"]
    print(f"  SKUs Detected:            {s['skus_detected']}")
    print(f"  SKUs Matched to Catalog:  {s['skus_matched']}")
    print(f"  SKUs Need Manual Review:  {s['skus_manual_review']}")
    print(f"  Items to Reorder:         {s['items_to_reorder']}")
    print(f"  Total Estimated Cost:     ${s['total_estimated_cost']:.2f}")
    print(f"  Pipeline Duration:        {s['pipeline_duration_seconds']}s")

    if result.get("sheet_url"):
        print(f"  Google Sheet:             {result['sheet_url']}")

    # ── Slack payload ──
    _section("SLACK BLOCK KIT PAYLOAD")
    print(json.dumps(result["slack_payload"], indent=2))

    # ── Save ──
    _save_output(result)


if __name__ == "__main__":
    main()
