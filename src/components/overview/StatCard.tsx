import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  accent?: string
}

export function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-hover">
        <Icon className="h-4 w-4" style={{ color: accent ?? 'currentColor' }} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-zinc-500">{label}</p>
        <p className="font-mono text-xl font-semibold tabular-nums text-zinc-100">{value}</p>
      </div>
    </div>
  )
}
