import { PackageSearch } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { GridSkeleton } from '../ui/GridSkeleton'
import { useInventory } from '../../hooks/useInventory'
import { InventoryCard } from './InventoryCard'
import { InventoryFilters, type StatusFilter } from './InventoryFilters'

export function InventoryGrid() {
  const { data, error, isLoading, retry } = useInventory()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const categories = useMemo(
    () => (data ? Array.from(new Set(data.items.map((item) => item.category))).sort() : []),
    [data],
  )

  const categoryAndSearchFiltered = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.items.filter((item) => {
      const matchesSearch =
        query === '' || item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query)
      const matchesCategory = category === 'all' || item.category === category
      return matchesSearch && matchesCategory
    })
  }, [data, search, category])

  const statusCounts = useMemo<Record<StatusFilter, number>>(
    () => ({
      all: categoryAndSearchFiltered.length,
      critical: categoryAndSearchFiltered.filter((item) => item.status === 'critical').length,
      low: categoryAndSearchFiltered.filter((item) => item.status === 'low').length,
      ok: categoryAndSearchFiltered.filter((item) => item.status === 'ok').length,
    }),
    [categoryAndSearchFiltered],
  )

  const visibleItems = useMemo(
    () => (status === 'all' ? categoryAndSearchFiltered : categoryAndSearchFiltered.filter((item) => item.status === status)),
    [categoryAndSearchFiltered, status],
  )

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || status !== 'all'

  function resetFilters() {
    setSearch('')
    setCategory('all')
    setStatus('all')
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-100">Live Inventory</h1>
        {data && (
          <p className="mt-1 text-sm text-zinc-500">
            {data.meta.total} SKUs tracked · {data.meta.lowCount} need attention
          </p>
        )}
      </div>

      {isLoading && <GridSkeleton />}

      {!isLoading && error && (
        <ErrorState title="Couldn't load inventory" code={error.code} message={error.message} onRetry={retry} />
      )}

      {!isLoading && !error && data && (
        <>
          <InventoryFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            status={status}
            onStatusChange={setStatus}
            statusCounts={statusCounts}
          />

          {data.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No inventory yet"
              message="Scan a shelf photo in Slack to start tracking stock."
            />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No items match your filters"
              message="Try a different search term or clear your filters."
              actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {visibleItems.map((item) => (
                <InventoryCard key={item.sku} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
