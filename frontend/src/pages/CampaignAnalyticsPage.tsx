import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getCampaignAnalytics } from '@/api/campaigns'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Banknote, Megaphone, Users } from 'lucide-react'

export default function CampaignAnalyticsPage() {
  const query = useQuery({
    queryKey: ['campaigns', 'analytics'],
    queryFn: getCampaignAnalytics,
  })

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaign Analytics" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaign Analytics" />
        <p className="text-sm text-muted-foreground">No data available.</p>
      </div>
    )
  }

  const { campaigns, summary } = query.data

  // Chart data: last 10 campaigns reversed to show chronological order
  const chartData = [...campaigns]
    .reverse()
    .slice(-10)
    .map((c) => ({
      name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
      Revenue: c.revenue_total,
      Delivered: c.messages_delivered,
      Read: c.messages_read ?? 0,
    }))

  const totalDelivered = campaigns.reduce((s, c) => s + (c.messages_delivered || 0), 0)
  const totalSent = campaigns.reduce((s, c) => s + (c.messages_sent || 0), 0)
  const avgDelivery = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Analytics"
        description="Revenue and delivery performance across all campaigns"
      />

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={<Megaphone className="h-4 w-4 text-indigo-500" />}
          label="Total Campaigns"
          value={summary.total_campaigns.toString()}
        />
        <SummaryCard
          icon={<Banknote className="h-4 w-4 text-amber-500" />}
          label="Total Revenue"
          value={formatCurrency(summary.total_revenue)}
          highlight
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Avg. Delivery Rate"
          value={`${avgDelivery}%`}
        />
        <SummaryCard
          icon={<Users className="h-4 w-4 text-cyan-500" />}
          label="Best Campaign"
          value={summary.best_campaign ?? '—'}
          sub={summary.best_campaign_revenue > 0 ? formatCurrency(summary.best_campaign_revenue) : undefined}
        />
      </div>

      {/* Revenue + Delivery chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue & Delivery (last {chartData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === 'Revenue' ? formatCurrency(v) : v.toLocaleString()
                  }
                />
                <Bar yAxisId="left" dataKey="Delivered" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="Read" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="Revenue" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 justify-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-cyan-500" />Delivered</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />Read</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />Revenue (KES)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-campaign table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No campaigns yet. Create your first campaign to see stats here.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Recipients</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Read</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Donors</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          to={`/campaigns/${c.id}`}
                          className="font-medium hover:underline text-foreground"
                        >
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">{(c.total_recipients || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-cyan-600 font-medium">{(c.messages_delivered || 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">({c.delivery_rate}%)</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-emerald-600 font-medium">{(c.messages_read ?? 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">({c.read_rate}%)</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {(c.messages_failed ?? 0) > 0 ? (
                          <span className="text-red-500 font-medium">{(c.messages_failed ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{c.revenue_donors.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {c.revenue_total > 0 ? (
                          <span className="font-semibold text-amber-600">{formatCurrency(c.revenue_total)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  icon, label, value, sub, highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={`text-xl font-bold leading-tight truncate ${highlight ? 'text-amber-700 dark:text-amber-400' : ''}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
