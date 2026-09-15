import { urgencyPlainLabel, urgencyStyle } from './urgency'

interface UrgencyBadgeProps {
  label: string
  score?: number
}

export function UrgencyBadge({ label, score }: UrgencyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold ${urgencyStyle(label)}`}
    >
      {urgencyPlainLabel(label)}
      {score != null && <span className="font-normal opacity-80">· {Math.round(score * 100)}%</span>}
    </span>
  )
}
