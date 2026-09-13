import { AlertTriangle, Camera, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useScan } from '../../hooks/useScan'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { BoundingBoxViewer } from './BoundingBoxViewer'
import { DetectionSidebar } from './DetectionSidebar'
import { ScanStatusBadge } from './ScanStatusBadge'

export function ScanDetail() {
  const { scanId = '' } = useParams()
  const { data: scan, error, isLoading, retry } = useScan(scanId)
  const [hoveredSku, setHoveredSku] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-surface" />
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="aspect-[4/3] w-full animate-pulse rounded-lg border border-border bg-surface lg:flex-1" />
          <div className="flex w-full flex-col gap-2 lg:w-80 lg:shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md border border-border bg-surface" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Scan not found"
          code={error.code}
          message={error.message}
          onRetry={retry}
          action={
            <Link to="/scans" className="mt-2 text-xs font-medium text-zinc-400 hover:text-zinc-200">
              ← Back to Scan History
            </Link>
          }
        />
      </div>
    )
  }

  if (!scan) return null

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">{scan.scanId}</h1>
          <p className="mt-1 text-sm text-zinc-500">{new Date(scan.createdAt).toLocaleString()}</p>
        </div>
        <ScanStatusBadge status={scan.status} />
      </div>

      {scan.status === 'processing' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-status-processing" />
          <p className="text-sm font-medium text-zinc-300">Still analyzing this scan…</p>
          <p className="text-sm text-zinc-500">Detections will appear here once processing completes.</p>
        </div>
      )}

      {scan.status === 'failed' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-status-critical/30 bg-status-critical/5 py-20 text-center">
          <AlertTriangle className="h-8 w-8 text-status-critical" />
          <p className="text-sm font-medium text-zinc-200">Detection failed</p>
          <p className="max-w-sm text-sm text-zinc-500">
            {scan.error ?? 'Something went wrong while processing this scan.'}
          </p>
        </div>
      )}

      {scan.status === 'complete' && scan.detections.length === 0 && (
        <EmptyState icon={Camera} title="No products detected" message="This scan didn't match any known products." />
      )}

      {scan.status === 'complete' && scan.detections.length > 0 && (
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="lg:flex-1">
            <BoundingBoxViewer
              imageUrl={scan.imageUrl}
              imageWidth={scan.imageWidth}
              imageHeight={scan.imageHeight}
              detections={scan.detections}
              hoveredSku={hoveredSku}
              onHoverSku={setHoveredSku}
            />
          </div>
          <DetectionSidebar detections={scan.detections} hoveredSku={hoveredSku} onHoverSku={setHoveredSku} />
        </div>
      )}
    </div>
  )
}
