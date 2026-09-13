import { useEffect, useRef, useState } from 'react'
import { STAGE_BY_ID } from '../agents'
import { fetchAgentActivity, subscribeToIdleActivity } from '../mocks/agentData'
import { agentRunBus } from '../mocks/agentRun'
import type { AgentActivityEntry } from '../types/agent'
import type { AgentRunSnapshot } from '../types/agentRun'

const MAX_ENTRIES = 20

export function useAgentActivity() {
  const [activity, setActivity] = useState<AgentActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const seenDoneRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    fetchAgentActivity().then((entries) => {
      if (!cancelled) {
        setActivity(entries)
        setIsLoading(false)
      }
    })

    const unsubscribeIdle = subscribeToIdleActivity((entry) => {
      if (!cancelled) setActivity((prev) => [entry, ...prev].slice(0, MAX_ENTRIES))
    })

    function handleRunChange(event: Event) {
      const snapshot = (event as CustomEvent<AgentRunSnapshot>).detail
      const isFreshRun = snapshot.phase === 'running' && snapshot.stages.every((s) => s.status !== 'done')
      if (isFreshRun) seenDoneRef.current = new Set()

      for (const stage of snapshot.stages) {
        if (stage.status !== 'done' || !stage.resultText) continue
        const key = `${stage.stageId}:${stage.resultText}`
        if (seenDoneRef.current.has(key)) continue
        seenDoneRef.current.add(key)

        const entry: AgentActivityEntry = {
          id: `run_${Date.now()}_${stage.stageId}`,
          stageId: stage.stageId,
          action: STAGE_BY_ID[stage.stageId].label,
          detail: stage.resultText,
          timestamp: new Date().toISOString(),
        }
        if (!cancelled) setActivity((prev) => [entry, ...prev].slice(0, MAX_ENTRIES))
      }
    }
    agentRunBus.addEventListener('change', handleRunChange)

    return () => {
      cancelled = true
      unsubscribeIdle()
      agentRunBus.removeEventListener('change', handleRunChange)
    }
  }, [])

  return { activity, isLoading }
}
