import type { UrgencyLabel } from '../../types/pipeline'
import { URGENCY_PLAIN_LABEL, URGENCY_STYLE } from './urgency'

interface UrgencyBadgeProps {
  label: UrgencyLabel
  score?: number
}

export function UrgencyBadge({ label, score }: UrgencyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold ${URGENCY_STYLE[label]}`}
    >
      {URGENCY_PLAIN_LABEL[label]}
      {score != null && <span className="font-normal opacity-80">· {Math.round(score * 100)}%</span>}
    </span>
  )
}
