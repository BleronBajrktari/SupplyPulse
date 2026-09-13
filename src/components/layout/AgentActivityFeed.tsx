import { STAGE_BY_ID } from '../../agents'
import type { AgentActivityEntry } from '../../types/agent'

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

interface AgentActivityFeedProps {
  activity: AgentActivityEntry[]
  isLoading?: boolean
  limit?: number
}

export function AgentActivityFeed({ activity, isLoading, limit }: AgentActivityFeedProps) {
  const entries = limit ? activity.slice(0, limit) : activity

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md border border-border bg-surface" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500">No agent activity yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => {
        const stage = STAGE_BY_ID[entry.stageId]
        return (
          <li key={entry.id} className="flex gap-3 rounded-md border border-border bg-surface p-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: stage.color }}>
                  {stage.tool}
                </span>
                <span className="shrink-0 text-xs text-zinc-500">{formatRelativeTime(entry.timestamp)}</span>
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-zinc-100">{entry.action}</p>
              <p className="truncate text-xs text-zinc-500">{entry.detail}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
