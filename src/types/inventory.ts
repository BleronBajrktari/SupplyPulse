export type InventoryStatus = 'ok' | 'low' | 'critical'

export interface InventoryItem {
  sku: string
  name: string
  category: string
  thumbnailUrl: string
  currentCount: number
  threshold: number
  reorderQty: number
  status: InventoryStatus
  lastScanId: string
  updatedAt: string
}

export interface InventoryResponse {
  items: InventoryItem[]
  meta: {
    total: number
    lowCount: number
  }
}
