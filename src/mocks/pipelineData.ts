import type { MatchedItem, PipelinePayload, ReorderPlanItem } from '../types/pipeline'

const REORDER_ITEMS: ReorderPlanItem[] = [
  {
    sku_id: 'OATML-1L',
    product_name: 'Oat Milk 1L',
    on_shelf_qty: 1,
    suggested_qty: 12,
    estimated_cost: 28.8,
    urgency_score: 0.95,
    urgency_label: 'URGENT',
    lead_time_days: 3,
  },
  {
    sku_id: 'COLA-330',
    product_name: 'Cola 330ml',
    on_shelf_qty: 5,
    suggested_qty: 24,
    estimated_cost: 21.6,
    urgency_score: 0.78,
    urgency_label: 'HIGH',
    lead_time_days: 2,
  },
  {
    sku_id: 'NAPKN-200',
    product_name: 'Napkins 200ct',
    on_shelf_qty: 8,
    suggested_qty: 10,
    estimated_cost: 19.0,
    urgency_score: 0.55,
    urgency_label: 'MEDIUM',
    lead_time_days: 4,
  },
]

const MATCHED: MatchedItem[] = REORDER_ITEMS.map((item) => ({
  matched: true,
  sku_id: item.sku_id,
  product_name: item.product_name,
  visual_quantity: item.on_shelf_qty,
  effective_quantity: item.on_shelf_qty,
  requires_manual_mapping: false,
}))

const UNMATCHED_NAMES = [
  'Sourdough Loaf', 'Free-Range Eggs 12pk', 'Cheddar Block 500g', 'Greek Yogurt 4-Pack',
  'Basmati Rice 2kg', 'Olive Oil 1L', 'Peanut Butter 340g', 'Instant Coffee 200g',
  'Green Tea 20 Bags', 'Tomato Ketchup 500ml', 'Spaghetti 500g', 'Canned Tuna 4-Pack',
  'Frozen Peas 1kg', 'Orange Juice 1L', 'Dark Chocolate Bar', 'Granola Bars 6-Pack',
  'Almond Milk 1L', 'Butter 250g', 'White Bread Loaf', 'Apple Cider Vinegar 500ml',
]

const UNMATCHED: MatchedItem[] = UNMATCHED_NAMES.map((name, i) => ({
  matched: false,
  sku_id: `det_${String(i + 1).padStart(2, '0')}`,
  product_name: name,
  visual_quantity: 3 + (i % 6),
  effective_quantity: 3 + (i % 6),
  requires_manual_mapping: true,
}))

export const PIPELINE_PAYLOAD: PipelinePayload = {
  summary: {
    skus_detected: 23,
    skus_matched: 3,
    skus_manual_review: 20,
    items_to_reorder: 3,
    total_estimated_cost: 69.4,
    pipeline_duration_seconds: 40.3,
    scan_confidence: 0.72,
  },
  reorder_plan: { items: REORDER_ITEMS },
  matched_items: [...MATCHED, ...UNMATCHED],
  integrations: {
    claude_vision: true,
    notion: true,
    google_sheets_read: true,
    google_sheets_write: true,
    slack: true,
  },
}

const MOCK_LATENCY_MS = 300

export function fetchPipelinePayload(): Promise<PipelinePayload> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(PIPELINE_PAYLOAD), MOCK_LATENCY_MS)
  })
}
