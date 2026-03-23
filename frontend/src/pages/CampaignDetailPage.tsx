import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
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

  const { campaign, recipients, delivery_rate } = reportQuery.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={campaign.name}
          action={<CampaignStatusBadge status={campaign.status} />}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          ['Recipients', campaign.total_recipients],
          ['Sent', campaign.messages_sent],
          ['Delivered', `${delivery_rate?.toFixed(1) ?? 0}%`],
        ].map(([label, val]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignReportChart report={reportQuery.data} />
        </CardContent>
      </Card>

      {recipients.length > 0 && (
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
                  <TableHead>Status</TableHead>
                  <TableHead>Delivered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.phone_number}</TableCell>
                    <TableCell>{r.name ?? '—'}</TableCell>
                    <TableCell>{r.member_status ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.delivered ? 'default' : 'outline'} className="text-xs">
                        {r.delivered ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
