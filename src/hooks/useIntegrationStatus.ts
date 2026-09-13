import { useEffect, useState } from 'react'
import { INTEGRATIONS, STAGE_INTEGRATIONS, type IntegrationConfig, type IntegrationId } from '../agents'
import { agentRunBus, getRunSnapshot } from '../mocks/agentRun'
import { getBaselineIntegrations, type IntegrationStatus } from '../mocks/integrations'
import { getActiveStageId, type AgentRunSnapshot } from '../types/agentRun'

export interface IntegrationDisplayState extends IntegrationConfig {
  status: IntegrationStatus
}

export function useIntegrationStatus(): IntegrationDisplayState[] {
  const [snapshot, setSnapshot] = useState<AgentRunSnapshot>(getRunSnapshot)

  useEffect(() => {
    function handleChange(event: Event) {
      setSnapshot((event as CustomEvent<AgentRunSnapshot>).detail)
    }
    agentRunBus.addEventListener('change', handleChange)
    return () => agentRunBus.removeEventListener('change', handleChange)
  }, [])

  const activeStageId = getActiveStageId(snapshot)
  const workingIds = new Set<IntegrationId>(activeStageId ? STAGE_INTEGRATIONS[activeStageId] : [])

  return getBaselineIntegrations().map((baseline) => ({
    ...INTEGRATIONS[baseline.id],
    status: workingIds.has(baseline.id) ? 'working' : baseline.status,
  }))
}
