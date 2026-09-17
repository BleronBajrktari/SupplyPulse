import { X } from 'lucide-react'
import { useAgentActivity } from '../../hooks/useAgentActivity'
import { AgentActivityFeed } from './AgentActivityFeed'

interface AgentActivityDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function AgentActivityDrawer({ isOpen, onClose }: AgentActivityDrawerProps) {
  const { activity, isLoading } = useAgentActivity()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close agent activity"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative flex h-full w-full max-w-sm flex-col border-l border-border bg-bg p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold text-fg">Agent Activity</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-fg-muted hover:bg-surface-hover hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AgentActivityFeed activity={activity} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
