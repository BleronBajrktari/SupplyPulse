interface StatTileProps {
  label: string
  value: string
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  )
}
