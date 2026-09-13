import { STAGES, type StageId } from '../agents'
import type { AgentRunSnapshot, RunResult } from '../types/agentRun'

/** Simulated SSE bus: dispatches a 'change' CustomEvent<AgentRunSnapshot> as the run progresses. No real network. */
export const agentRunBus = new EventTarget()

const STAGE_DURATIONS_MS: Record<StageId, number> = {
  vision: 900,
  notion: 700,
  reason: 650,
  act: 1100,
}

const MOCK_RESULT: RunResult = {
  scanId: 'scan_9f7c',
  detectedCount: 5,
  items: [
    { sku: 'OATML-1L', name: 'Oat Milk 1L', currentCount: 2, threshold: 12, orderQty: 24, supplier: 'NordMilk AB', leadTimeDays: 3 },
    { sku: 'COLA-330', name: 'Cola 330ml', currentCount: 5, threshold: 24, orderQty: 48, supplier: 'BevCo', leadTimeDays: 2 },
    { sku: 'NAPKN-200', name: 'Napkins 200ct', currentCount: 8, threshold: 20, orderQty: 40, supplier: 'CleanCo', leadTimeDays: 4 },
  ],
  poRowNumber: 344,
  slackChannel: '#restock',
}

const STAGE_RESULT_TEXT: Record<StageId, string> = {
  vision: `${MOCK_RESULT.detectedCount} SKUs detected`,
  notion: `${MOCK_RESULT.detectedCount} of ${MOCK_RESULT.detectedCount} matched to catalog`,
  reason: `${MOCK_RESULT.items.length} items below threshold`,
  act: `PO row #${MOCK_RESULT.poRowNumber} written · card posted to ${MOCK_RESULT.slackChannel}`,
}

function createIdleSnapshot(): AgentRunSnapshot {
  return {
    phase: 'idle',
    stages: STAGES.map((s) => ({ stageId: s.id, status: 'pending' as const })),
    result: null,
  }
}

let snapshot: AgentRunSnapshot = createIdleSnapshot()
let timers: ReturnType<typeof setTimeout>[] = []
let isRunning = false

function emit() {
  agentRunBus.dispatchEvent(new CustomEvent<AgentRunSnapshot>('change', { detail: snapshot }))
}

export function getRunSnapshot(): AgentRunSnapshot {
  return snapshot
}

export function isAgentRunning(): boolean {
  return isRunning
}

export function startAgentRun(): void {
  if (isRunning) return
  isRunning = true
  timers.forEach(clearTimeout)
  timers = []

  snapshot = createIdleSnapshot()
  snapshot = { ...snapshot, phase: 'running' }
  emit()

  let elapsed = 0
  STAGES.forEach((stage, i) => {
    const duration = STAGE_DURATIONS_MS[stage.id]
    const isLast = i === STAGES.length - 1

    timers.push(
      setTimeout(() => {
        snapshot = {
          ...snapshot,
          stages: snapshot.stages.map((s) => (s.stageId === stage.id ? { ...s, status: 'active' } : s)),
        }
        emit()
      }, elapsed),
    )

    elapsed += duration

    timers.push(
      setTimeout(() => {
        snapshot = {
          ...snapshot,
          phase: isLast ? 'complete' : snapshot.phase,
          result: isLast ? MOCK_RESULT : snapshot.result,
          stages: snapshot.stages.map((s) =>
            s.stageId === stage.id
              ? { ...s, status: 'done', resultText: STAGE_RESULT_TEXT[stage.id], elapsedMs: duration }
              : s,
          ),
        }
        emit()
        if (isLast) isRunning = false
      }, elapsed),
    )
  })
}

export function resetAgentRun(): void {
  timers.forEach(clearTimeout)
  timers = []
  isRunning = false
  snapshot = createIdleSnapshot()
  emit()
}
