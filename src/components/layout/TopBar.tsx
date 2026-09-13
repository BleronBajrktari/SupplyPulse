import { Bot, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LiveStatusBadge, type ConnectionState } from './LiveStatusBadge'
import { SyncBadge, type SyncState } from './SyncBadge'

interface TopBarProps {
  connectionState: ConnectionState
  syncState: SyncState
  onToggleAgents: () => void
}

export function TopBar({ connectionState, syncState, onToggleAgents }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg px-4">
      <span className="shrink-0 font-mono text-sm font-semibold tracking-tight text-zinc-100">
        SupplyPulse
      </span>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search SKU or product…"
          className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAgents}
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-hover"
        >
          <Bot className="h-3.5 w-3.5" />
          Agents
        </button>
        <SyncBadge state={syncState} onClick={() => navigate('/health')} />
        <LiveStatusBadge state={connectionState} />
      </div>
    </header>
  )
}
