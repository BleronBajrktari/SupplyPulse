import { useCallback } from 'react'
import { fetchScan } from '../api/scans'
import type { ShelfScan } from '../types/scan'
import { useAsync } from './useAsync'

export function useScan(scanId: string) {
  const fetcher = useCallback(() => fetchScan(scanId), [scanId])
  return useAsync<ShelfScan>(fetcher, scanId)
}
