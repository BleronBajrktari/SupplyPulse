import type { InventoryStatus } from '../../types/inventory'

const STATUS_CONFIG: Record<InventoryStatus, { label: string; dot: string; text: string }> = {
  critical: { label: 'Critical', dot: 'bg-status-critical', text: 'text-status-critical' },
  low: { label: 'Low', dot: 'bg-status-low', text: 'text-status-low' },
  ok: { label: 'OK', dot: 'bg-status-ok', text: 'text-status-ok' },
}

export function StatusBadge({ status }: { status: InventoryStatus }) {
  const { label, dot, text } = STATUS_CONFIG[status]

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className={text}>{label}</span>
    </span>
  )
}
