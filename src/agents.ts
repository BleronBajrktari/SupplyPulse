import { BookOpen, Calculator, ScanEye, Send, type LucideIcon } from 'lucide-react'

/**
 * The ONE place that describes the agent model: a single Claude orchestrator
 * running a perceive -> reason -> act loop across four tools. Everything that
 * displays agent/stage/integration names, colors, or copy reads from here.
 */
export const ORCHESTRATOR = {
  name: 'Claude',
  tagline: 'One agent, four tools, one loop: perceive → reason → act.',
}

export type IntegrationId = 'claude' | 'notion' | 'sheets' | 'slack'

export interface IntegrationConfig {
  id: IntegrationId
  name: string
  icon: LucideIcon
  color: string
}

export const INTEGRATIONS: Record<IntegrationId, IntegrationConfig> = {
  claude: { id: 'claude', name: 'Claude', icon: Calculator, color: 'var(--color-status-processing)' },
  notion: { id: 'notion', name: 'Notion', icon: BookOpen, color: '#a78bfa' },
  sheets: { id: 'sheets', name: 'Google Sheets', icon: Send, color: 'var(--color-status-ok)' },
  slack: { id: 'slack', name: 'Slack', icon: Send, color: 'var(--color-status-low)' },
}

export const INTEGRATION_ORDER: IntegrationId[] = ['claude', 'notion', 'sheets', 'slack']

export type StageId = 'vision' | 'notion' | 'reason' | 'act'

export interface StageConfig {
  id: StageId
  tool: string
  icon: LucideIcon
  color: string
  label: string
  description: string
}

export const STAGES: StageConfig[] = [
  {
    id: 'vision',
    tool: 'Vision',
    icon: ScanEye,
    color: 'var(--color-status-processing)',
    label: 'Analyzing shelf photo',
    description: "Claude looks at the uploaded shelf photo and counts every product it can see.",
  },
  {
    id: 'notion',
    tool: 'Notion',
    icon: BookOpen,
    color: '#a78bfa',
    label: 'Matching against Notion catalog',
    description: 'Claude looks up each detected item in the Notion product catalog to resolve its SKU.',
  },
  {
    id: 'reason',
    tool: 'Claude',
    icon: Calculator,
    color: 'var(--color-status-low)',
    label: 'Calculating reorder vs thresholds',
    description: 'Claude compares live counts against configured thresholds and sizes a reorder for anything running low.',
  },
  {
    id: 'act',
    tool: 'Google Sheets + Slack',
    icon: Send,
    color: 'var(--color-status-ok)',
    label: 'Writing PO + posting to Slack',
    description: 'Claude writes the purchase order to Google Sheets and posts an approval card to Slack.',
  },
]

export const STAGE_BY_ID: Record<StageId, StageConfig> = Object.fromEntries(
  STAGES.map((s) => [s.id, s]),
) as Record<StageId, StageConfig>

/** Which integration dot(s) should pulse "working" while a given stage is active. */
export const STAGE_INTEGRATIONS: Record<StageId, IntegrationId[]> = {
  vision: ['claude'],
  notion: ['notion'],
  reason: ['claude'],
  act: ['sheets', 'slack'],
}
