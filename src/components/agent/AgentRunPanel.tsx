import { CheckCircle2, Circle, Loader2, Play, RotateCcw } from 'lucide-react'
import { STAGES } from '../../agents'
import { useAgentRun } from '../../hooks/useAgentRun'

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

export function AgentRunPanel() {
  const { phase, stages, result, approved, run, reset, approve } = useAgentRun()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100">Agent Run</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Perceive → reason → act, across Vision, Notion, Claude, and Sheets + Slack.
          </p>
        </div>

        {phase === 'idle' && (
          <button
            type="button"
            onClick={run}
            className="flex shrink-0 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
          >
            <Play className="h-4 w-4" />
            Run Agent
          </button>
        )}

        {phase === 'running' && (
          <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-zinc-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running…
          </span>
        )}

        {phase === 'complete' && (
          <button
            type="button"
            onClick={reset}
            className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-hover"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Run again
          </button>
        )}
      </div>

      {phase !== 'idle' && (
        <ol className="flex flex-col gap-2">
          {STAGES.map((stageConfig) => {
            const stageState = stages.find((s) => s.stageId === stageConfig.id)
            if (!stageState) return null
            const Icon = stageConfig.icon

            return (
              <li
                key={stageConfig.id}
                className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                  stageState.status === 'active' ? 'border-zinc-500 bg-surface-hover' : 'border-border bg-bg'
                }`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${stageConfig.color} 20%, transparent)`,
                    color: stageConfig.color,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: stageConfig.color }}>
                      {stageConfig.tool}
                    </span>
                    <span className="text-sm font-medium text-zinc-100">{stageConfig.label}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {stageState.status === 'done' ? stageState.resultText : stageConfig.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {stageState.status === 'done' && stageState.elapsedMs != null && (
                    <span className="font-mono text-xs tabular-nums text-zinc-500">
                      {formatElapsed(stageState.elapsedMs)}
                    </span>
                  )}
                  {stageState.status === 'active' && <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />}
                  {stageState.status === 'done' && <CheckCircle2 className="h-4 w-4 text-status-ok" />}
                  {stageState.status === 'pending' && <Circle className="h-4 w-4 text-zinc-700" />}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {phase === 'complete' && result && (
        <div className="rounded-md border border-border bg-bg p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">{result.items.length} items below threshold</h3>
          <ul className="mb-4 flex flex-col gap-1.5">
            {result.items.map((item) => (
              <li key={item.sku} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">
                  {item.name} <span className="font-mono text-xs text-zinc-500">· {item.supplier}</span>
                </span>
                <span className="font-mono tabular-nums text-zinc-300">
                  {item.currentCount}/{item.threshold} → +{item.orderQty}
                </span>
              </li>
            ))}
          </ul>

          {approved ? (
            <div className="flex items-center gap-2 rounded-md border border-status-ok/30 bg-status-ok/10 px-3 py-2 text-sm text-status-ok">
              <CheckCircle2 className="h-4 w-4" />
              Row added to Sheets · Card posted to Slack
            </div>
          ) : (
            <button
              type="button"
              onClick={approve}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Approve Order
            </button>
          )}
        </div>
      )}
    </div>
  )
}
