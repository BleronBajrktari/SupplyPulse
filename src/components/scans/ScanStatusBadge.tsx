import type { ScanStatus } from '../../types/scan'

const STATUS_CONFIG: Record<ScanStatus, { label: string; dot: string; text: string }> = {
  complete: { label: 'Complete', dot: 'bg-status-ok', text: 'text-status-ok' },
  processing: { label: 'Processing', dot: 'bg-status-processing', text: 'text-status-processing' },
  failed: { label: 'Failed', dot: 'bg-status-critical', text: 'text-status-critical' },
}

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const { label, dot, text } = STATUS_CONFIG[status]

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${status === 'processing' ? 'animate-pulse' : ''}`} />
      <span className={text}>{label}</span>
    </span>
  )
}
