import { Cloud, CloudOff, RefreshCw } from 'lucide-react'

export type SyncState = 'healthy' | 'syncing' | 'error'

interface SyncBadgeProps {
  state: SyncState
  onClick?: () => void
}

const STATE_CONFIG: Record<SyncState, { label: string; text: string; icon: typeof Cloud; spin: boolean }> = {
  healthy: { label: 'Sheets synced', text: 'text-status-ok', icon: Cloud, spin: false },
  syncing: { label: 'Syncing…', text: 'text-status-processing', icon: RefreshCw, spin: true },
  error: { label: 'Sync error', text: 'text-status-critical', icon: CloudOff, spin: false },
}

export function SyncBadge({ state, onClick }: SyncBadgeProps) {
  const { label, text, icon: Icon, spin } = STATE_CONFIG[state]

  return (
    <button
      type="button"
      onClick={onClick}
      title="View integration and sync status"
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 transition-colors hover:bg-surface-hover"
    >
      <Icon className={`h-3.5 w-3.5 ${text} ${spin ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </button>
  )
}
