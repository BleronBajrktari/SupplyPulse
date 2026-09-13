interface GridSkeletonProps {
  count?: number
}

export function GridSkeleton({ count = 8 }: GridSkeletonProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 h-28 rounded-md bg-surface-hover" />
          <div className="mb-2 h-3.5 w-3/4 rounded bg-surface-hover" />
          <div className="mb-3 h-3 w-1/3 rounded bg-surface-hover" />
          <div className="h-3 w-full rounded bg-surface-hover" />
        </div>
      ))}
    </div>
  )
}
