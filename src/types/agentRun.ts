import type { StageId } from '../agents'

export type StageRunStatus = 'pending' | 'active' | 'done'

export interface StageRunState {
  stageId: StageId
  status: StageRunStatus
  resultText?: string
  elapsedMs?: number
}

export interface RunResultItem {
  sku: string
  name: string
  currentCount: number
  threshold: number
  orderQty: number
  supplier: string
  leadTimeDays: number
}

export interface RunResult {
  scanId: string
  detectedCount: number
  items: RunResultItem[]
  poRowNumber: number
  slackChannel: string
}

export type AgentRunPhase = 'idle' | 'running' | 'complete'

export interface AgentRunSnapshot {
  phase: AgentRunPhase
  stages: StageRunState[]
  result: RunResult | null
}

/** Derives the currently-active stage (if any) from a snapshot's stage list. */
export function getActiveStageId(snapshot: AgentRunSnapshot): StageId | null {
  return snapshot.stages.find((s) => s.status === 'active')?.stageId ?? null
}
