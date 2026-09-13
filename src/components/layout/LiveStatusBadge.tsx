export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected'

interface LiveStatusBadgeProps {
  state: ConnectionState
}

const STATE_CONFIG: Record<ConnectionState, { label: string; dot: string; pulse: boolean; tooltip: string }> = {
  connected: {
    label: 'Live',
    dot: 'bg-status-ok',
    pulse: true,
    tooltip: 'Connected — updates stream in automatically',
  },
  reconnecting: {
    label: 'Reconnecting…',
    dot: 'bg-status-low',
    pulse: true,
    tooltip: 'Reconnecting to the live update stream',
  },
  disconnected: {
    label: 'Offline',
    dot: 'bg-status-critical',
    pulse: false,
    tooltip: 'Offline — data shown may be out of date',
  },
}

export function LiveStatusBadge({ state }: LiveStatusBadgeProps) {
  const { label, dot, pulse, tooltip } = STATE_CONFIG[state]

  return (
    <button
      type="button"
      title={tooltip}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 transition-colors hover:bg-surface-hover"
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-75`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="text-xs font-medium tabular-nums text-zinc-300">{label}</span>
    </button>
  )
}
