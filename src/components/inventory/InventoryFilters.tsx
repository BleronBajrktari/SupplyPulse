import { Search } from 'lucide-react'
import type { InventoryStatus } from '../../types/inventory'

export type StatusFilter = 'all' | InventoryStatus

interface InventoryFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  categories: string[]
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  statusCounts: Record<StatusFilter, number>
}

const STATUS_TABS: { key: StatusFilter; label: string; dot?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical', dot: 'bg-status-critical' },
  { key: 'low', label: 'Low', dot: 'bg-status-low' },
  { key: 'ok', label: 'OK', dot: 'bg-status-ok' },
]

export function InventoryFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  status,
  onStatusChange,
  statusCounts,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by name or SKU…"
          className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
        {STATUS_TABS.map(({ key, label, dot }) => {
          const isActive = status === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive ? 'bg-surface-hover text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
              {label}
              <span className="tabular-nums text-zinc-500">{statusCounts[key]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
