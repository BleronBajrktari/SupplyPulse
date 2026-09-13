import type { ReorderPlanItem } from '../types/pipeline'
import { PIPELINE_PAYLOAD } from './pipelineData'

export interface AlertLogEntry {
  id: string
  timestamp: string
  shop: string
  skus_detected: number
  items_to_reorder: number
  total_cost: number
  slack_sent: boolean
  items: ReorderPlanItem[]
}

const HISTORY: AlertLogEntry[] = [
  {
    id: 'run_2f9a',
    timestamp: '2026-09-13T11:11:58Z',
    shop: 'Downtown Market',
    skus_detected: 23,
    items_to_reorder: 3,
    total_cost: 69.4,
    slack_sent: true,
    items: PIPELINE_PAYLOAD.reorder_plan.items,
  },
  {
    id: 'run_1c7b',
    timestamp: '2026-09-12T16:03:21Z',
    shop: 'Downtown Market',
    skus_detected: 19,
    items_to_reorder: 2,
    total_cost: 41.2,
    slack_sent: true,
    items: [
      { sku_id: 'CHIPS-BBQ', product_name: 'BBQ Chips', on_shelf_qty: 4, suggested_qty: 24, estimated_cost: 26.4, urgency_score: 0.7, urgency_label: 'HIGH', lead_time_days: 3 },
      { sku_id: 'PRETZL-BAG', product_name: 'Pretzel Bag', on_shelf_qty: 3, suggested_qty: 18, estimated_cost: 14.8, urgency_score: 0.62, urgency_label: 'MEDIUM', lead_time_days: 3 },
    ],
  },
  {
    id: 'run_09e4',
    timestamp: '2026-09-11T09:47:59Z',
    shop: 'Riverside Grocers',
    skus_detected: 27,
    items_to_reorder: 1,
    total_cost: 22.0,
    slack_sent: false,
    items: [
      { sku_id: 'TOILET-12PK', product_name: 'Toilet Paper 12-Pack', on_shelf_qty: 2, suggested_qty: 6, estimated_cost: 22.0, urgency_score: 0.9, urgency_label: 'URGENT', lead_time_days: 5 },
    ],
  },
  {
    id: 'run_88d1',
    timestamp: '2026-09-09T14:20:11Z',
    shop: 'Riverside Grocers',
    skus_detected: 21,
    items_to_reorder: 4,
    total_cost: 88.6,
    slack_sent: true,
    items: [
      { sku_id: 'WATER-500', product_name: 'Sparkling Water 500ml', on_shelf_qty: 10, suggested_qty: 24, estimated_cost: 13.2, urgency_score: 0.5, urgency_label: 'MEDIUM', lead_time_days: 2 },
      { sku_id: 'YOGRT-4PK', product_name: 'Greek Yogurt 4-Pack', on_shelf_qty: 3, suggested_qty: 16, estimated_cost: 44.8, urgency_score: 0.81, urgency_label: 'HIGH', lead_time_days: 3 },
      { sku_id: 'ICECRM-PT', product_name: 'Ice Cream Pint', on_shelf_qty: 2, suggested_qty: 12, estimated_cost: 26.4, urgency_score: 0.68, urgency_label: 'MEDIUM', lead_time_days: 4 },
      { sku_id: 'DTRGNT-1L', product_name: 'Dish Detergent 1L', on_shelf_qty: 2, suggested_qty: 2, estimated_cost: 3.4, urgency_score: 0.4, urgency_label: 'MEDIUM', lead_time_days: 5 },
    ],
  },
]

const MOCK_LATENCY_MS = 350

export function fetchAlertLog(): Promise<AlertLogEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(HISTORY), MOCK_LATENCY_MS)
  })
}

export function resendAlert(_entryId: string): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500))
}
