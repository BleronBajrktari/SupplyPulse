import { useIntegrationStatus } from '../../hooks/useIntegrationStatus'

const STATUS_LABEL = {
  connected: 'Connected',
  working: 'Working…',
  error: 'Error',
} as const

export function IntegrationStatusStrip() {
  const integrations = useIntegrationStatus()

  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-border bg-bg px-4 py-1.5">
      {integrations.map(({ id, name, icon: Icon, color, status }) => (
        <div key={id} className="flex items-center gap-1.5" title={`${name}: ${STATUS_LABEL[status]}`}>
          <span className="relative flex h-1.5 w-1.5">
            {status === 'working' && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: color }}
              />
            )}
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: status === 'error' ? 'var(--color-status-critical)' : color }}
            />
          </span>
          <Icon className="h-3 w-3 text-fg-muted" />
          <span className="text-xs font-medium text-fg-muted">{name}</span>
        </div>
      ))}
    </div>
  )
}
