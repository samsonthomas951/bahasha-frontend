import { useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getChurches } from '@/api/churches'
import { getMessageStats } from '@/api/messages'
import { listCampaigns } from '@/api/campaigns'
import { getGroupStatistics } from '@/api/groups'
import { getChurchStats } from '@/api/churches'
import { useChurchStore } from '@/stores/churchStore'
import { useAuthStore } from '@/stores/authStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Users, MessageCircle, Megaphone, HandCoins, Building2 } from 'lucide-react'
import { isChurchAdmin, isSuperAdmin } from '@/types/auth'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  // Super admin's home is /admin, not /dashboard
  if (isSuperAdmin(user)) return <Navigate to="/admin" replace />
  const activeChurchId = useChurchStore((s) => s.activeChurchId)
  const setActiveChurch = useChurchStore((s) => s.setActiveChurch)

  // Fetch churches to detect first-time church_admin with no church
  const churchesQuery = useQuery({
    queryKey: ['churches'],
    queryFn: getChurches,
    enabled: isChurchAdmin(user),
  })

  // Auto-select the first church if none is selected
  useEffect(() => {
    if (churchesQuery.data && churchesQuery.data.length > 0 && !activeChurchId) {
      setActiveChurch(churchesQuery.data[0].id)
    }
  }, [churchesQuery.data, activeChurchId, setActiveChurch])

  // Redirect church_admin with no churches to the setup page
  useEffect(() => {
    if (
      isChurchAdmin(user) &&
      !churchesQuery.isLoading &&
      churchesQuery.data?.length === 0
    ) {
      navigate('/churches/new', { replace: true })
    }
  }, [user, churchesQuery.isLoading, churchesQuery.data, navigate])

  const statsQuery = useQuery({
    queryKey: ['churches', activeChurchId, 'stats'],
    queryFn: () => getChurchStats(activeChurchId!),
    enabled: !!activeChurchId,
  })
  const msgStatsQuery = useQuery({
    queryKey: ['messages', 'stats'],
    queryFn: getMessageStats,
  })
  const campaignsQuery = useQuery({
    queryKey: ['campaigns', { page: 1, per_page: 5 }],
    queryFn: () => listCampaigns({ page: 1, per_page: 5 }),
  })
  const groupStatsQuery = useQuery({
    queryKey: ['groups', 'statistics'],
    queryFn: getGroupStatistics,
  })

  const stats = statsQuery.data
  const msgStats = msgStatsQuery.data
  const groupStats = groupStatsQuery.data

  // Loading state
  if (isChurchAdmin(user) && churchesQuery.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Church admin with no church — show a friendly setup prompt while redirect fires
  if (isChurchAdmin(user) && churchesQuery.data?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to Bahasha</h2>
          <p className="text-muted-foreground max-w-sm">
            You don't have a church set up yet. Create your first church to get started.
          </p>
        </div>
        <Button asChild>
          <Link to="/churches/new">Set up your church</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your church activity" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={groupStats?.summary?.total_members}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={groupStatsQuery.isLoading}
        />
        <StatCard
          title="Total Donations"
          value={stats ? formatCurrency(stats.total_amount) : undefined}
          icon={<HandCoins className="h-4 w-4 text-muted-foreground" />}
          loading={statsQuery.isLoading}
        />
        <StatCard
          title="Messages"
          value={msgStats?.total}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
          loading={msgStatsQuery.isLoading}
        />
        <StatCard
          title="Campaigns"
          value={campaignsQuery.data?.total}
          icon={<Megaphone className="h-4 w-4 text-muted-foreground" />}
          loading={campaignsQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {msgStatsQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : msgStats ? (
              <dl className="space-y-2 text-sm">
                {[
                  ['Sent', msgStats.sent],
                  ['Delivered', msgStats.delivered],
                  ['Read', msgStats.read],
                  ['Received', msgStats.received],
                  ['Failed', msgStats.failed],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : campaignsQuery.data?.items?.length ? (
              <ul className="space-y-2">
                {campaignsQuery.data.items.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="ml-2 shrink-0 capitalize text-muted-foreground">{c.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string
  value: string | number | undefined
  icon: React.ReactNode
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? '—'}</div>
        )}
      </CardContent>
    </Card>
  )
}
