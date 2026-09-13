import { Camera } from 'lucide-react'
import { AgentRunPanel } from '../agent/AgentRunPanel'
import { useScans } from '../../hooks/useScans'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { GridSkeleton } from '../ui/GridSkeleton'
import { ScanCard } from './ScanCard'

export function ScanHistory() {
  const { data, error, isLoading, retry } = useScans()

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-100">Shelf Scan History</h1>
        {data && <p className="mt-1 text-sm text-zinc-500">{data.length} scans</p>}
      </div>

      <AgentRunPanel />

      {isLoading && <GridSkeleton />}

      {!isLoading && error && (
        <ErrorState title="Couldn't load scan history" code={error.code} message={error.message} onRetry={retry} />
      )}

      {!isLoading && !error && data && (
        data.length === 0 ? (
          <EmptyState icon={Camera} title="No scans yet" message="Upload a shelf photo in Slack to see it here." />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {data.map((scan) => (
              <ScanCard key={scan.scanId} scan={scan} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
