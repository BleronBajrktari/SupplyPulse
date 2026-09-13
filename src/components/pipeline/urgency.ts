import type { UrgencyLabel } from '../../types/pipeline'

export const URGENCY_STYLE: Record<UrgencyLabel, string> = {
  URGENT: 'bg-red-500/15 text-red-400 border-red-500/30',
  HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  MEDIUM: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

export const URGENCY_DOT_STYLE: Record<UrgencyLabel, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-amber-500',
  MEDIUM: 'bg-emerald-500',
}

export const URGENCY_PLAIN_LABEL: Record<UrgencyLabel, string> = {
  URGENT: 'Order now',
  HIGH: 'Order soon',
  MEDIUM: 'Can wait',
}
