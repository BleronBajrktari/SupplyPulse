export type ConfidenceTier = 'high' | 'mid' | 'low'

export function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.7) return 'mid'
  return 'low'
}

export const CONFIDENCE_COLOR: Record<ConfidenceTier, string> = {
  high: 'var(--color-status-ok)',
  mid: 'var(--color-status-low)',
  low: 'var(--color-status-critical)',
}

export const CONFIDENCE_TEXT_CLASS: Record<ConfidenceTier, string> = {
  high: 'text-status-ok',
  mid: 'text-status-low',
  low: 'text-status-critical',
}
