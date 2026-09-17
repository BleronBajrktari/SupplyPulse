import { PackageOpen, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon = PackageOpen, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
      <Icon className="h-8 w-8 text-fg-muted" />
      <div>
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-1 text-sm text-fg-muted">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
