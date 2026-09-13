import { INTEGRATION_ORDER, type IntegrationId } from '../agents'

export type IntegrationStatus = 'connected' | 'working' | 'error'

export interface IntegrationBaseline {
  id: IntegrationId
  status: IntegrationStatus
}

/** Single mock source of truth for baseline integration health (no live run in progress). */
export function getBaselineIntegrations(): IntegrationBaseline[] {
  return INTEGRATION_ORDER.map((id) => ({ id, status: 'connected' as const }))
}
