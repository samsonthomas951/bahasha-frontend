
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { Toaster } from '@/components/ui/toaster'

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'System Overview',
  '/admin/templates': 'WA Templates',
  '/dashboard': 'Dashboard',
  '/churches': 'Churches',
  '/churches/new': 'New Church',
  '/messages': 'Messages',
  '/campaigns': 'Campaigns',
  '/groups': 'Groups',
  '/donations': 'Donations',
  '/profile': 'Profile',
}

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/churches/')) return 'Church Details'
  if (pathname.startsWith('/campaigns/')) return 'Campaign Details'
  if (pathname.startsWith('/groups/')) return 'Group Details'
  return 'Bahasha'
}

export function AppShell() {
  const location = useLocation()

  useEffect(() => {
    const title = getPageTitle(location.pathname)
    document.title = `${title} | Bahasha`
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
