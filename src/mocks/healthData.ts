export type ConnectionState = 'connected' | 'degraded' | 'error'

export interface IntegrationHealth {
  id: string
  name: string
  description: string
  state: ConnectionState
  latencyMs: number
}

const BASELINE: IntegrationHealth[] = [
  { id: 'bedrock', name: 'AWS Bedrock', description: 'Claude Vision image analysis', state: 'connected', latencyMs: 812 },
  { id: 'notion', name: 'Notion Catalog', description: 'Product catalog lookups', state: 'connected', latencyMs: 194 },
  { id: 'sheets_read', name: 'Sheets Read', description: 'Sales velocity data', state: 'connected', latencyMs: 231 },
  { id: 'sheets_write', name: 'Sheets Write', description: 'Purchase order rows', state: 'connected', latencyMs: 267 },
  { id: 'slack', name: 'Slack Webhook', description: 'Approval card delivery', state: 'connected', latencyMs: 148 },
]

export const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/demo'

const MOCK_LATENCY_MS = 300

export function fetchIntegrationHealth(): Promise<IntegrationHealth[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(BASELINE), MOCK_LATENCY_MS)
  })
}

/** Simulates re-testing every connection: same shape, freshly jittered latency. */
export function testAllConnections(): Promise<IntegrationHealth[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        BASELINE.map((entry) => ({
          ...entry,
          latencyMs: Math.round(entry.latencyMs * (0.85 + Math.random() * 0.3)),
        })),
      )
    }, 900)
  })
}
