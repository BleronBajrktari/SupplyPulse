export type ScanStatus = 'processing' | 'complete' | 'failed'

export interface BoundingBox {
  x: number
  y: number
  w: number
  h: number
}

export interface ScanDetection {
  sku: string
  label: string
  confidence: number
  count: number
  bbox: BoundingBox
}

export interface ShelfScan {
  scanId: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  status: ScanStatus
  detections: ScanDetection[]
  createdAt: string
  error?: string
}
