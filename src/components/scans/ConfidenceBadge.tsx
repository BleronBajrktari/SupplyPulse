import { CONFIDENCE_TEXT_CLASS, getConfidenceTier } from './confidence'

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tier = getConfidenceTier(confidence)

  return (
    <span className={`font-mono text-xs font-medium tabular-nums ${CONFIDENCE_TEXT_CLASS[tier]}`}>
      {Math.round(confidence * 100)}%
    </span>
  )
}
