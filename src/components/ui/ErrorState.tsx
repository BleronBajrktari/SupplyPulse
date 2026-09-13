import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

interface ErrorStateProps {
  title?: string
  code?: string
  message: string
  onRetry: () => void
  action?: ReactNode
}

export function ErrorState({ title = "Couldn't load data", code, message, onRetry, action }: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-status-critical/30 bg-status-critical/5 py-20 text-center">
      <AlertTriangle className="h-8 w-8 text-status-critical" />
      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {message}
          {code ? ` (${code})` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-status-critical/40 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-surface-hover"
        >
          Retry
        </button>
        {action}
      </div>
    </div>
  )
}
