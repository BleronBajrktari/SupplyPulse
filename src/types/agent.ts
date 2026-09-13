import type { StageId } from '../agents'

export interface AgentActivityEntry {
  id: string
  stageId: StageId
  action: string
  detail: string
  timestamp: string
}
