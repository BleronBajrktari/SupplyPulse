import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { AgentActivityDrawer } from './AgentActivityDrawer'
import { IntegrationStatusStrip } from './IntegrationStatusStrip'
import type { ConnectionState } from './LiveStatusBadge'
import type { SyncState } from './SyncBadge'

interface AppShellProps {
  connectionState: ConnectionState
  syncState: SyncState
}

export function AppShell({ connectionState, syncState }: AppShellProps) {
  const [isAgentsOpen, setIsAgentsOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-bg text-zinc-200">
      <TopBar
        connectionState={connectionState}
        syncState={syncState}
        onToggleAgents={() => setIsAgentsOpen((open) => !open)}
      />
      <IntegrationStatusStrip />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AgentActivityDrawer isOpen={isAgentsOpen} onClose={() => setIsAgentsOpen(false)} />
    </div>
  )
}
