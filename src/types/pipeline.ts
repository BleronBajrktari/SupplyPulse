export interface PipelineSummary {
  skus_detected: number
  skus_matched: number
  skus_manual_review: number
  items_to_reorder: number
  total_estimated_cost: number
  pipeline_duration_seconds: number
  scan_confidence: number
}

export type UrgencyLabel = 'URGENT' | 'HIGH' | 'MEDIUM'

export interface ReorderPlanItem {
  sku_id: string
  product_name: string
  on_shelf_qty: number
  suggested_qty: number
  estimated_cost: number
  urgency_score: number
  urgency_label: UrgencyLabel
  lead_time_days: number
}

export interface MatchedItem {
  matched: boolean
  sku_id: string
  product_name: string
  visual_quantity: number
  effective_quantity: number
  requires_manual_mapping?: boolean
}

export interface IntegrationsStatus {
  claude_vision: boolean
  notion: boolean
  google_sheets_read: boolean
  google_sheets_write: boolean
  slack: boolean
}

export interface PipelinePayload {
  summary: PipelineSummary
  reorder_plan: { items: ReorderPlanItem[] }
  matched_items: MatchedItem[]
  integrations: IntegrationsStatus
}
