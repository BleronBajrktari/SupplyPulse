export interface PipelineStepDef {
  id: string
  label: string
  toolLabel: string
}

export const PIPELINE_STEPS: PipelineStepDef[] = [
  { id: 'vision', label: 'Analyzing image', toolLabel: 'AWS Bedrock / Claude Vision' },
  { id: 'catalog', label: 'Fetching catalog', toolLabel: 'Notion API' },
  { id: 'sales', label: 'Loading sales data', toolLabel: 'Google Sheets Read' },
  { id: 'matching', label: 'Matching products', toolLabel: 'Fuzzy Matcher' },
  { id: 'reorder', label: 'Calculating reorder', toolLabel: 'Math Engine' },
  { id: 'alert', label: 'Sending alert', toolLabel: 'Slack Webhook + Google Sheets Write' },
]

/** Simulated per-step duration in ms (compressed for demo purposes; the real backend run is ~40s, as reflected in the summary payload). */
const STEP_DURATIONS_MS = [700, 550, 500, 650, 600, 850]

export type PipelineStepStatus = 'pending' | 'active' | 'done'

export interface PipelineStepState {
  id: string
  status: PipelineStepStatus
}

export type PipelineRunPhase = 'idle' | 'running' | 'complete'

export interface PipelineRunSnapshot {
  phase: PipelineRunPhase
  steps: PipelineStepState[]
}

export const pipelineRunBus = new EventTarget()

function createIdleSnapshot(): PipelineRunSnapshot {
  return {
    phase: 'idle',
    steps: PIPELINE_STEPS.map((s) => ({ id: s.id, status: 'pending' as const })),
  }
}

let snapshot: PipelineRunSnapshot = createIdleSnapshot()
let timers: ReturnType<typeof setTimeout>[] = []
let isRunning = false

function emit() {
  pipelineRunBus.dispatchEvent(new CustomEvent<PipelineRunSnapshot>('change', { detail: snapshot }))
}

export function getPipelineSnapshot(): PipelineRunSnapshot {
  return snapshot
}

export function startPipelineRun(): void {
  if (isRunning) return
  isRunning = true
  timers.forEach(clearTimeout)
  timers = []

  snapshot = { ...createIdleSnapshot(), phase: 'running' }
  emit()

  let elapsed = 0
  PIPELINE_STEPS.forEach((step, i) => {
    const duration = STEP_DURATIONS_MS[i]
    const isLast = i === PIPELINE_STEPS.length - 1

    timers.push(
      setTimeout(() => {
        snapshot = {
          ...snapshot,
          steps: snapshot.steps.map((s) => (s.id === step.id ? { ...s, status: 'active' } : s)),
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
          steps: snapshot.steps.map((s) => (s.id === step.id ? { ...s, status: 'done' } : s)),
        }
        emit()
        if (isLast) isRunning = false
      }, elapsed),
    )
  })
}

export function resetPipelineRun(): void {
  timers.forEach(clearTimeout)
  timers = []
  isRunning = false
  snapshot = createIdleSnapshot()
  emit()
}
