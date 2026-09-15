import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav-items'

export function SideNav() {
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-bg p-3">
      {NAV_ITEMS.map(({ key, label, path, icon: Icon }) => (
        <NavLink
          key={key}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-border bg-surface text-fg'
                : 'border-transparent text-fg-muted hover:bg-surface-hover hover:text-fg'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
