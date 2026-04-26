import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  MessageCircle,
  Megaphone,
  Users,
  HandCoins,
  User,
  ShieldCheck,
  LayoutTemplate,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { isSuperAdmin } from '@/types/auth'

const CHURCH_ADMIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/churches', label: 'Churches', icon: Building2, end: false },
  { to: '/messages', label: 'Messages', icon: MessageCircle, end: false },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone, end: false },
  { to: '/groups', label: 'Groups', icon: Users, end: false },
  { to: '/donations', label: 'Donations', icon: HandCoins, end: false },
  { to: '/manual-donations', label: 'Manual Entry', icon: ClipboardList, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: true },
]

const SUPER_ADMIN_NAV = [
  { to: '/admin', label: 'System Overview', icon: ShieldCheck, end: true },
  { to: '/admin/templates', label: 'WA Templates', icon: LayoutTemplate, end: true },
  { to: '/churches', label: 'All Churches', icon: Building2, end: false },
  { to: '/messages', label: 'Messages', icon: MessageCircle, end: false },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone, end: false },
  { to: '/groups', label: 'Groups', icon: Users, end: false },
  { to: '/donations', label: 'Donations', icon: HandCoins, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: true },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const navItems = isSuperAdmin(user) ? SUPER_ADMIN_NAV : CHURCH_ADMIN_NAV

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-lg font-bold tracking-tight">Bahasha</span>
        {isSuperAdmin(user) && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Admin
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
