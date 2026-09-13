import { Package } from 'lucide-react'
import { useState } from 'react'
import type { ScanDetection } from '../../types/scan'
import { CONFIDENCE_COLOR, getConfidenceTier } from './confidence'

interface BoundingBoxViewerProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  detections: ScanDetection[]
  hoveredSku: string | null
  onHoverSku: (sku: string | null) => void
}

export function BoundingBoxViewer({
  imageUrl,
  imageWidth,
  imageHeight,
  detections,
  hoveredSku,
  onHoverSku,
}: BoundingBoxViewerProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-bg"
      style={{ aspectRatio: `${imageWidth} / ${imageHeight}` }}
    >
      {imgError ? (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-10 w-10 text-zinc-700" />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="Shelf scan"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}

      {/* normalized 0-1 coords: no resize math needed, the box just stretches with the viewport */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
        {detections.map((d, i) => {
          const tier = getConfidenceTier(d.confidence)
          const isHovered = hoveredSku === d.sku
          return (
            <rect
              key={d.sku}
              x={d.bbox.x}
              y={d.bbox.y}
              width={d.bbox.w}
              height={d.bbox.h}
              fill={CONFIDENCE_COLOR[tier]}
              fillOpacity={isHovered ? 0.15 : 0}
              stroke={CONFIDENCE_COLOR[tier]}
              strokeWidth={isHovered ? 0.006 : 0.004}
              className="animate-[bbox-in_0.4s_ease-out_backwards] cursor-pointer transition-[stroke-width,fill-opacity] duration-150"
              style={{ animationDelay: `${i * 70}ms` }}
              onMouseEnter={() => onHoverSku(d.sku)}
              onMouseLeave={() => onHoverSku(null)}
            />
          )
        })}
      </svg>

      {/* labels live in their own HTML layer, positioned by percentage, so text never warps under the SVG's non-uniform viewBox scale */}
      <div className="pointer-events-none absolute inset-0">
        {detections.map((d) => {
          const tier = getConfidenceTier(d.confidence)
          const isHovered = hoveredSku === d.sku
          return (
            <span
              key={d.sku}
              className="absolute -translate-y-full whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-950 transition-opacity"
              style={{
                left: `${d.bbox.x * 100}%`,
                top: `${d.bbox.y * 100}%`,
                backgroundColor: CONFIDENCE_COLOR[tier],
                opacity: isHovered ? 1 : 0.85,
              }}
            >
              {d.label} · {Math.round(d.confidence * 100)}%
            </span>
          )
        })}
      </div>
    </div>
  )
}
