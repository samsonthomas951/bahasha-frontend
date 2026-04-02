import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Users, Send, CheckCheck, BookOpen, XCircle,
  TrendingUp, Banknote, BarChart3, ReceiptText,
} from 'lucide-react'
import { getCampaignReport } from '@/api/campaigns'
import { CampaignForm } from '@/components/campaigns/CampaignForm'
import { CampaignReportChart } from '@/components/campaigns/CampaignReportChart'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import type { CampaignRecipient } from '@/types/campaign'

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const isNew = campaignId === 'new'
  const id = isNew ? null : Number(campaignId)
  const navigate = useNavigate()

  const reportQuery = useQuery({
    queryKey: ['campaigns', id, 'report'],
    queryFn: () => getCampaignReport(id!),
    enabled: !!id,
  })

  if (isNew) {
    return (
      <div className="space-y-6">
        <PageHeader title="New Campaign" />
        <div className="max-w-5xl">
          <CampaignForm />
        </div>
      </div>
    )
  }

  if (reportQuery.isLoading) return <Skeleton className="h-96 w-full" />
  if (!reportQuery.data) return <p className="text-sm text-muted-foreground">Campaign not found</p>

  const { campaign, recipients, summary, revenue } = reportQuery.data

  const sent = summary.messages_sent
  const delivered = summary.messages_delivered
  const read = summary.messages_read
  const failed = summary.messages_failed

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={campaign.name}
          description={campaign.created_at ? `Created ${formatDate(campaign.created_at)}` : undefined}
          action={<CampaignStatusBadge status={campaign.status} />}
        />
      </div>

      {/* Top-level KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={<Users className="h-4 w-4 text-indigo-500" />} label="Recipients" value={campaign.total_recipients.toLocaleString()} />
        <KpiCard icon={<Send className="h-4 w-4 text-purple-500" />} label="Sent" value={sent.toLocaleString()} />
        <KpiCard icon={<CheckCheck className="h-4 w-4 text-cyan-500" />} label="Delivered" value={`${delivered.toLocaleString()} (${summary.delivery_rate}%)`} />
        <KpiCard icon={<BookOpen className="h-4 w-4 text-emerald-500" />} label="Read" value={`${read.toLocaleString()} (${summary.read_rate}%)`} />
        <KpiCard icon={<XCircle className="h-4 w-4 text-red-500" />} label="Failed" value={`${failed.toLocaleString()} (${summary.fail_rate}%)`} />
        <KpiCard icon={<Banknote className="h-4 w-4 text-amber-500" />} label="Revenue" value={formatCurrency(revenue?.total_amount ?? 0)} highlight />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />Overview
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />Revenue
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <Users className="mr-1.5 h-3.5 w-3.5" />Recipients
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignReportChart report={reportQuery.data} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Delivery Breakdown</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <MetricRow label="Sent" value={sent} total={campaign.total_recipients} color="bg-purple-500" />
                  <MetricRow label="Delivered" value={delivered} total={sent} color="bg-cyan-500" />
                  <MetricRow label="Read" value={read} total={delivered} color="bg-emerald-500" />
                  <MetricRow label="Failed" value={failed} total={sent} color="bg-red-500" />
                  <MetricRow label="Responded" value={summary.responses_received} total={read} color="bg-blue-500" />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Campaign Info</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Template', campaign.message_template ?? '—'],
                    ['Audience', campaign.target_audience],
                    ['Type', campaign.campaign_type ?? '—'],
                    ['Scheduled', formatDateTime(campaign.scheduled_time)],
                    ['Completed', formatDateTime(campaign.completed_at)],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground shrink-0">{label}</dt>
                      <dd className="font-medium text-right truncate">{String(val)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── REVENUE TAB ── */}
        <TabsContent value="revenue" className="space-y-4 pt-4">
          {revenue ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <RevenueCard label="Total Raised" value={formatCurrency(revenue.total_amount)} sub={`from ${revenue.donor_count} donor${revenue.donor_count !== 1 ? 's' : ''}`} />
                <RevenueCard label="Conversion Rate" value={`${revenue.conversion_rate}%`} sub="of campaign recipients donated" />
                <RevenueCard label="Avg. per Donor" value={revenue.donor_count > 0 ? formatCurrency(revenue.total_amount / revenue.donor_count) : '—'} sub="average donation" />
              </div>

              {revenue.donors.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ReceiptText className="h-4 w-4" />
                      Donor Breakdown ({revenue.donors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="text-right">Donations</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Last Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenue.donors.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{d.name || '—'}</TableCell>
                            <TableCell className="font-mono text-sm">{d.phone_number}</TableCell>
                            <TableCell className="text-right">{d.donation_count}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              {formatCurrency(d.total_amount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {d.donations[d.donations.length - 1]?.receipt || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center">
                  <Banknote className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No donations recorded for this campaign yet.</p>
                  <p className="text-xs text-muted-foreground">Donations from campaign recipients made after the campaign date will appear here.</p>
                </div>
              )}
            </>
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </TabsContent>

        {/* ── RECIPIENTS TAB ── */}
        <TabsContent value="recipients" className="pt-4">
          {recipients.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recipients ({recipients.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead>Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((r: CampaignRecipient) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.phone_number}</TableCell>
                        <TableCell>{r.name ?? '—'}</TableCell>
                        <TableCell><StatusDot active={r.message_sent} /></TableCell>
                        <TableCell><StatusDot active={r.delivered} /></TableCell>
                        <TableCell><StatusDot active={r.read} /></TableCell>
                        <TableCell>
                          {r.failed ? (
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                          ) : (
                            <StatusDot active={false} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">No recipients on record.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KpiCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className={`text-base font-bold leading-tight ${highlight ? 'text-amber-700 dark:text-amber-400' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function RevenueCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function MetricRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toLocaleString()} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-muted-foreground/25'}`} />
  )
}
