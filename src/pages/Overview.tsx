import { AlertTriangle, ClipboardList, Package, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AgentRunPanel } from '../components/agent/AgentRunPanel'
import { AgentActivityFeed } from '../components/layout/AgentActivityFeed'
import { DeficitProjectionChart } from '../components/overview/DeficitProjectionChart'
import { StatCard } from '../components/overview/StatCard'
import { StockDistributionDonut } from '../components/overview/StockDistributionDonut'
import { useAgentActivity } from '../hooks/useAgentActivity'
import { INVENTORY_ITEMS } from '../mocks/inventoryData'
import { getDeficitProjection } from '../mocks/overviewData'
import { fetchReorderPlans } from '../mocks/restockData'
import { SCANS } from '../mocks/scansData'

const statusCounts = {
  ok: INVENTORY_ITEMS.filter((i) => i.status === 'ok').length,
  low: INVENTORY_ITEMS.filter((i) => i.status === 'low').length,
  critical: INVENTORY_ITEMS.filter((i) => i.status === 'critical').length,
}

const allDetections = SCANS.flatMap((scan) => scan.detections)
const agentAccuracy = allDetections.length
  ? allDetections.reduce((sum, d) => sum + d.confidence, 0) / allDetections.length
  : 0

const deficitProjection = getDeficitProjection()

export default function Overview() {
  const [pendingPOs, setPendingPOs] = useState<number | null>(null)
  const { activity, isLoading: isActivityLoading } = useAgentActivity()

  useEffect(() => {
    let cancelled = false
    fetchReorderPlans().then((res) => {
      if (!cancelled) setPendingPOs(res.plans.filter((p) => p.status === 'pending').length)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-100">Operations Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Live snapshot across inventory, restocking, and the agent pipeline.</p>
      </div>

      <AgentRunPanel />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={String(INVENTORY_ITEMS.length)} icon={Package} />
        <StatCard
          label="Critical Alerts"
          value={String(statusCounts.critical)}
          icon={AlertTriangle}
          accent="var(--color-status-critical)"
        />
        <StatCard
          label="Pending POs"
          value={pendingPOs === null ? '—' : String(pendingPOs)}
          icon={ClipboardList}
          accent="var(--color-status-low)"
        />
        <StatCard
          label="Agent Accuracy"
          value={`${Math.round(agentAccuracy * 100)}%`}
          icon={Target}
          accent="var(--color-status-ok)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Stock Distribution</h2>
          <StockDistributionDonut counts={statusCounts} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">7-Day Deficit Projection</h2>
          <DeficitProjectionChart data={deficitProjection} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Agent Activity</h2>
        <AgentActivityFeed activity={activity} isLoading={isActivityLoading} limit={6} />
      </div>
    </div>
  )
}
