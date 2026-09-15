interface StatTileProps {
  label: string
  value: string
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-fg">{value}</p>
    </div>
  )
}
