import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import {
  getChurch,
  getChurchStats,
  getChurchMembers,
  deleteChurch,
  initializeSheets,
  getChurchSheets,
  getSheetsStatus,
} from '@/api/churches'
import { PageHeader } from '@/components/layout/PageHeader'
import { AdminMembersPanel } from '@/components/churches/AdminMembersPanel'
import { MpesaSettingsPanel } from '@/components/churches/MpesaSettingsPanel'
import { ChurchForm } from '@/components/churches/ChurchForm'
import { MemberTable } from '@/components/churches/MemberTable'
import { SheetsStatusBadge } from '@/components/churches/SheetsStatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useChurchStore } from '@/stores/churchStore'
import type { Church } from '@/types/church'

export default function ChurchDetailPage() {
  const { churchId } = useParams<{ churchId: string }>()
  const isNew = churchId === 'new'
  const id = isNew ? null : Number(churchId)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const setActiveChurch = useChurchStore((s) => s.setActiveChurch)
  const [membersPage, setMembersPage] = useState(1)

  const churchQuery = useQuery({
    queryKey: ['churches', id],
    queryFn: () => getChurch(id!),
    enabled: !!id,
  })
  const statsQuery = useQuery({
    queryKey: ['churches', id, 'stats'],
    queryFn: () => getChurchStats(id!),
    enabled: !!id,
  })
  const membersQuery = useQuery({
    queryKey: ['churches', id, 'members', membersPage, 50],
    queryFn: () => getChurchMembers(id!, membersPage, 50),
    enabled: !!id,
  })
  const sheetsQuery = useQuery({
    queryKey: ['churches', id, 'sheets'],
    queryFn: () => getChurchSheets(id!),
    enabled: !!id,
  })

  // Shares the same cache key as SheetsStatusBadge — no duplicate network requests
  const sheetsStatusQuery = useQuery({
    queryKey: ['churches', id, 'sheets-status'],
    queryFn: () => getSheetsStatus(id!),
    refetchInterval: (query) => {
      const s = query.state.data?.sheets_status
      return s === 'completed' || s === 'failed' ? false : 10000
    },
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteChurch(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches'] })
      navigate('/churches')
    },
  })

  const initSheetsMutation = useMutation({
    mutationFn: () => initializeSheets(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches', id, 'sheets-status'] })
    },
  })

  if (isNew) {
    return (
      <div className="space-y-6">
        <PageHeader title="New Church" />
        <div className="max-w-2xl">
          <ChurchForm onSuccess={(c: Church) => { setActiveChurch(c.id); navigate(`/churches/${c.id}`) }} />
        </div>
      </div>
    )
  }

  if (churchQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const church = churchQuery.data
  if (!church) return <p className="text-sm text-muted-foreground">Church not found</p>

  return (
    <div className="space-y-6">
      <PageHeader
        title={church.name}
        description={church.code}
        action={
          <div className="flex items-center gap-2">
            <SheetsStatusBadge churchId={church.id} initialStatus={church.sheets_status} />
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(`Delete ${church.name}?`)) deleteMutation.mutate()
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="sheets">Sheets</TabsTrigger>
          <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statsQuery.isLoading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
              : statsQuery.data && (
                  <>
                    <StatCard title="Users" value={statsQuery.data.total_users} />
                    <StatCard title="Donations" value={statsQuery.data.total_donations} />
                    <StatCard title="Total Amount" value={formatCurrency(statsQuery.data.total_donation_amount)} />
                    <StatCard title="Avg Donation" value={formatCurrency(statsQuery.data.average_donation)} />
                  </>
                )}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {church.city && <Field label="City" value={church.city} />}
            {church.country && <Field label="Country" value={church.country} />}
            {church.phone && <Field label="Phone" value={church.phone} />}
            {church.email && <Field label="Email" value={church.email} />}
            {church.mpesa_shortcode && <Field label="M-Pesa Shortcode" value={church.mpesa_shortcode} />}
            {church.template_name && <Field label="WA Template" value={church.template_name} />}
          </dl>
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <div className="max-w-2xl">
            <ChurchForm church={church} />
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MemberTable
            churchId={church.id}
            members={membersQuery.data?.members ?? []}
            page={membersPage}
            totalPages={membersQuery.data?.pages ?? 1}
            total={membersQuery.data?.total ?? 0}
            onPageChange={setMembersPage}
          />
        </TabsContent>

        <TabsContent value="accounts" className="mt-4 space-y-3">
          <div>
            <h3 className="text-base font-semibold">Admin Members</h3>
            <p className="text-sm text-muted-foreground">
              Manage who can administer this church (up to 4 admins total). Admins can optionally be notified by email when added.
            </p>
          </div>
          <AdminMembersPanel churchId={church.id} />
        </TabsContent>

        <TabsContent value="sheets" className="mt-4 space-y-4">
          {(() => {
            const liveStatus = sheetsStatusQuery.data?.sheets_status ?? church.sheets_status ?? 'none'
            return (
              <div className="flex items-center gap-3">
                <SheetsStatusBadge churchId={church.id} initialStatus={church.sheets_status} />
                {liveStatus === 'pending' && (
                  <p className="text-sm text-muted-foreground">
                    Setting up in the background — this usually takes under a minute.
                  </p>
                )}
                {liveStatus === 'none' && (
                  <Button
                    size="sm"
                    onClick={() => initSheetsMutation.mutate()}
                    disabled={initSheetsMutation.isPending}
                  >
                    {initSheetsMutation.isPending ? 'Initializing…' : 'Initialize Sheets'}
                  </Button>
                )}
                {liveStatus === 'failed' && (
                  <div className="flex items-center gap-3">
                    {sheetsStatusQuery.data?.sheets_error && (
                      <p className="text-sm text-destructive">{sheetsStatusQuery.data.sheets_error}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => initSheetsMutation.mutate()}
                      disabled={initSheetsMutation.isPending}
                    >
                      {initSheetsMutation.isPending ? 'Retrying…' : 'Retry'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}
          {sheetsQuery.data && sheetsQuery.data.length > 0 && (
            <div className="space-y-2">
              {sheetsQuery.data.map((sheet) => (
                <div key={sheet.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <span className="font-medium">{sheet.sheet_name}</span>
                    <Badge variant="outline" className="ml-2 text-xs capitalize">
                      {sheet.sheet_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {sheet.period_start && <span>{formatDate(sheet.period_start)}</span>}
                    {sheet.web_view_link && (
                      <a
                        href={sheet.web_view_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mpesa" className="mt-4 space-y-3">
          <div>
            <h3 className="text-base font-semibold">M-Pesa Settings</h3>
            <p className="text-sm text-muted-foreground">
              Connect your Safaricom Daraja account. Credentials are validated against Safaricom
              and stored encrypted. Each church uses its own shortcode.
            </p>
          </div>
          <div className="max-w-lg">
            <MpesaSettingsPanel churchId={church.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
