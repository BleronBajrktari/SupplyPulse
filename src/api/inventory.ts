import { INVENTORY_MOCK } from '../mocks/inventoryData'
import type { ApiError } from '../types/api'
import type { InventoryResponse } from '../types/inventory'

export type { ApiError }

const MOCK_LATENCY_MS = 500

export function fetchInventory(): Promise<InventoryResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(INVENTORY_MOCK), MOCK_LATENCY_MS)
  })
}
