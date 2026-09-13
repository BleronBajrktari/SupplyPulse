import { useEffect, useState } from 'react'
import { agentRunBus, getRunSnapshot, resetAgentRun, startAgentRun } from '../mocks/agentRun'
import type { AgentRunSnapshot } from '../types/agentRun'

export function useAgentRun() {
  const [snapshot, setSnapshot] = useState<AgentRunSnapshot>(getRunSnapshot)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    function handleChange(event: Event) {
      setSnapshot((event as CustomEvent<AgentRunSnapshot>).detail)
    }
    agentRunBus.addEventListener('change', handleChange)
    return () => agentRunBus.removeEventListener('change', handleChange)
  }, [])

  const run = () => {
    setApproved(false)
    startAgentRun()
  }

  const reset = () => {
    setApproved(false)
    resetAgentRun()
  }

  const approve = () => setApproved(true)

  return { ...snapshot, approved, run, reset, approve }
}
