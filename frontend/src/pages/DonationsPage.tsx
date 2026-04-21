import { useQuery } from '@tanstack/react-query'
import { getChurchStats } from '@/api/churches'
import { useChurchStore } from '@/stores/churchStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DonationsPage() {
  const activeChurchId = useChurchStore((s) => s.activeChurchId)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['churches', activeChurchId, 'stats'],
    queryFn: () => getChurchStats(activeChurchId!),
    enabled: !!activeChurchId,
  })

  if (!activeChurchId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Donations" />
        <p className="text-sm text-muted-foreground">
          Select a church from the top bar to view donations.
        </p>
      </div>
    )
  }

  const categoryData = stats
    ? [
        { name: 'Tithe', value: 0 },
        { name: 'Offering', value: 0 },
        { name: 'Local Budget', value: 0 },
        { name: 'Development', value: 0 },
        { name: 'Evangelism', value: 0 },
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader title="Donations" description="M-Pesa donation overview" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : stats ? (
          <>
            <StatCard title="Total Donations" value={String(stats.donation_count)} />
            <StatCard title="Total Amount" value={formatCurrency(stats.total_amount)} />
            <StatCard title="Average" value={formatCurrency(stats.average_donation)} />
            <StatCard title="Total Members" value={String(stats.user_count)} />
          </>
        ) : null}
      </div>

      {stats && categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
