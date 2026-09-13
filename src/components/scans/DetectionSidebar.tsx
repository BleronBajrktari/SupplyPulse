import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { INVENTORY_ITEMS } from '../../mocks/inventoryData'
import type { ScanDetection } from '../../types/scan'
import { ConfidenceBadge } from './ConfidenceBadge'

const KNOWN_SKUS = new Set(INVENTORY_ITEMS.map((item) => item.sku))

interface DetectionSidebarProps {
  detections: ScanDetection[]
  hoveredSku: string | null
  onHoverSku: (sku: string | null) => void
}

export function DetectionSidebar({ detections, hoveredSku, onHoverSku }: DetectionSidebarProps) {
  return (
    <div className="flex w-full flex-col gap-2 lg:w-80 lg:shrink-0">
      <h2 className="text-sm font-medium text-zinc-300">{detections.length} items detected</h2>
      <ul className="flex flex-col gap-2">
        {detections.map((d) => {
          const isHovered = hoveredSku === d.sku
          const isTracked = KNOWN_SKUS.has(d.sku)

          return (
            <li
              key={d.sku}
              onMouseEnter={() => onHoverSku(d.sku)}
              onMouseLeave={() => onHoverSku(null)}
              className={`flex items-center justify-between gap-3 rounded-md border p-3 transition-colors ${
                isHovered ? 'border-zinc-500 bg-surface-hover' : 'border-border bg-surface'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{d.label}</p>
                <p className="font-mono text-xs text-zinc-500">
                  {d.sku} · qty {d.count}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ConfidenceBadge confidence={d.confidence} />
                {isTracked ? (
                  <Link
                    to={`/inventory/${d.sku}`}
                    className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-xs text-zinc-600">Not tracked</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
