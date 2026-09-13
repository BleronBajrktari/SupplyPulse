import { fetchInventory } from '../api/inventory'
import type { InventoryResponse } from '../types/inventory'
import { useAsync } from './useAsync'

export function useInventory() {
  return useAsync<InventoryResponse>(fetchInventory, 'inventory')
}
