import { Camera } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ShelfScan } from '../../types/scan'
import { ScanStatusBadge } from './ScanStatusBadge'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ScanCard({ scan }: { scan: ShelfScan }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={() => navigate(`/scans/${scan.scanId}`)}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-hover"
    >
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-md bg-bg">
        {imgError ? (
          <Camera className="h-8 w-8 text-zinc-600" />
        ) : (
          <img
            src={scan.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-zinc-500">{scan.scanId}</span>
        <ScanStatusBadge status={scan.status} />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{formatTimestamp(scan.createdAt)}</span>
        <span>{scan.detections.length} items</span>
      </div>
    </button>
  )
}
