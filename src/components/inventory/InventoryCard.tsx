import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { InventoryItem } from '../../types/inventory'
import { StatusBadge } from './StatusBadge'

const STATUS_STRIPE: Record<InventoryItem['status'], string> = {
  critical: 'border-l-status-critical',
  low: 'border-l-status-low',
  ok: 'border-l-status-ok',
}

const STATUS_FILL: Record<InventoryItem['status'], string> = {
  critical: 'bg-status-critical',
  low: 'bg-status-low',
  ok: 'bg-status-ok',
}

interface InventoryCardProps {
  item: InventoryItem
}

export function InventoryCard({ item }: InventoryCardProps) {
  const navigate = useNavigate()
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  const progress = Math.min(100, Math.round((item.currentCount / item.threshold) * 100))

  return (
    <button
      type="button"
      onClick={() => navigate(`/inventory/${item.sku}`)}
      className={`flex flex-col gap-2 rounded-lg border border-l-4 border-border bg-surface p-3 text-left transition-colors hover:bg-surface-hover ${STATUS_STRIPE[item.status]}`}
    >
      <div className="flex items-center gap-2">
        {!thumbFailed && (
          <img
            src={item.thumbnailUrl}
            alt=""
            className={`h-8 w-8 shrink-0 rounded object-cover ${thumbLoaded ? '' : 'hidden'}`}
            onLoad={() => setThumbLoaded(true)}
            onError={() => setThumbFailed(true)}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{item.name}</span>
        <StatusBadge status={item.status} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-fg-muted">{item.sku}</span>
        <span className="shrink-0 text-xs text-fg-muted">{item.category}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
          <div className={`h-full rounded-full ${STATUS_FILL[item.status]}`} style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-fg">
          {item.currentCount}/{item.threshold}
        </span>
      </div>
    </button>
  )
}
