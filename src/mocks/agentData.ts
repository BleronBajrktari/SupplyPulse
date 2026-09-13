import { getRunSnapshot } from './agentRun'
import type { AgentActivityEntry } from '../types/agent'

const SEED_ACTIVITY: Omit<AgentActivityEntry, 'id' | 'timestamp'>[] = [
  { stageId: 'vision', action: 'Analyzed shelf photo', detail: 'scan_8f2a · produce shelf, 5 SKUs detected' },
  { stageId: 'notion', action: 'Matched catalog SKU', detail: 'OATML-1L resolved at 94% confidence' },
  { stageId: 'reason', action: 'Sized a reorder', detail: 'plan_8f01 · NordMilk AB · urgency 92%' },
  { stageId: 'act', action: 'Wrote PO + posted card', detail: '2 rows appended for plan_8f01 · #restock' },
  { stageId: 'vision', action: 'Analyzed shelf photo', detail: 'scan_3b11 · cereal aisle, 6 SKUs detected' },
  { stageId: 'notion', action: 'Flagged unrecognized SKU', detail: 'GRANBAR-6PK has no catalog match (58% confidence)' },
  { stageId: 'reason', action: 'Sized a reorder', detail: 'plan_8f02 · BevCo · urgency 74%' },
  { stageId: 'act', action: 'Sync completed', detail: '342 rows written, 0 errors' },
  { stageId: 'reason', action: 'Suggested threshold change', detail: 'MILK-WHOLE-1L min level 15 → 18' },
  { stageId: 'act', action: 'Plan dispatched', detail: 'plan_8f03 approved and sent to PaperCo' },
]

function buildSeedActivity(): AgentActivityEntry[] {
  const now = Date.now()
  return SEED_ACTIVITY.map((entry, i) => ({
    ...entry,
    id: `activity_${i}`,
    timestamp: new Date(now - (SEED_ACTIVITY.length - i) * 4 * 60 * 1000).toISOString(),
  }))
}

const MOCK_LATENCY_MS = 400

export function fetchAgentActivity(): Promise<AgentActivityEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildSeedActivity()), MOCK_LATENCY_MS)
  })
}

const IDLE_ACTIONS: Omit<AgentActivityEntry, 'id' | 'timestamp'>[] = [
  { stageId: 'vision', action: 'Watching for new shelf photos', detail: 'No pending uploads' },
  { stageId: 'notion', action: 'Notion catalog synced', detail: 'Ready for the next match' },
  { stageId: 'reason', action: 'Threshold check idle', detail: 'All plans up to date' },
  { stageId: 'act', action: 'Sheets + Slack connected', detail: 'Ready to write the next PO' },
]

/** Ambient idle ticker — pauses automatically while a real agent run is in progress. */
export function subscribeToIdleActivity(onEntry: (entry: AgentActivityEntry) => void, intervalMs = 9000): () => void {
  let i = 0
  const timer = setInterval(() => {
    if (getRunSnapshot().phase === 'running') return
    const template = IDLE_ACTIONS[i % IDLE_ACTIONS.length]
    i += 1
    onEntry({ ...template, id: `idle_${Date.now()}_${i}`, timestamp: new Date().toISOString() })
  }, intervalMs)

  return () => clearInterval(timer)
}
