import { SCANS } from '../mocks/scansData'
import type { ApiError } from '../types/api'
import type { ShelfScan } from '../types/scan'

const MOCK_LATENCY_MS = 500

export function fetchScans(): Promise<ShelfScan[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(SCANS), MOCK_LATENCY_MS)
  })
}

export function fetchScan(scanId: string): Promise<ShelfScan> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const scan = SCANS.find((s) => s.scanId === scanId)
      if (scan) {
        resolve(scan)
      } else {
        const error: ApiError = { code: 'SCAN_NOT_FOUND', message: `No scan with id ${scanId}` }
        reject(error)
      }
    }, MOCK_LATENCY_MS)
  })
}
