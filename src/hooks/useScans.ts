import { fetchScans } from '../api/scans'
import type { ShelfScan } from '../types/scan'
import { useAsync } from './useAsync'

export function useScans() {
  return useAsync<ShelfScan[]>(fetchScans, 'scans')
}
