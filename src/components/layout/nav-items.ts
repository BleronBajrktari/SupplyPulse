import {
  Activity,
  BookOpen,
  History,
  LayoutDashboard,
  ScanLine,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type NavKey = 'scan' | 'dashboard' | 'catalog' | 'velocity' | 'health' | 'history'

export interface NavItem {
  key: NavKey
  label: string
  path: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'scan', label: 'Scan', path: '/', icon: ScanLine },
  { key: 'dashboard', label: 'Scan Results', path: '/dashboard', icon: LayoutDashboard },
  { key: 'catalog', label: 'Catalog', path: '/catalog', icon: BookOpen },
  { key: 'velocity', label: 'Sales Velocity', path: '/velocity', icon: TrendingUp },
  { key: 'health', label: 'Integration Health', path: '/health', icon: Activity },
  { key: 'history', label: 'Alert Log', path: '/history', icon: History },
]
