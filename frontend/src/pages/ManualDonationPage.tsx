import { useRef, useState, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Trash2, PlusCircle, Send } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useChurchStore } from '@/stores/churchStore'
import { getChurchAdmins } from '@/api/churches'
import { submitManualDonations } from '@/api/donations'
import type { ManualDonationEntry } from '@/api/donations'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

const today = () => new Date().toISOString().slice(0, 10)

interface FormState {
  donor_name: string
  phone_number: string
  member_status: 'member' | 'visitor'
  transaction_date: string
  tithe: string
  offering: string
  camp_meeting: string
  church_development: string
  evangelism: string
  evangelism_local: string
  station_dev: string
}

const emptyForm = (): FormState => ({
  donor_name: '',
  phone_number: '',
  member_status: 'visitor',
  transaction_date: today(),
  tithe: '',
  offering: '',
  camp_meeting: '',
  church_development: '',
  evangelism: '',
  evangelism_local: '',
  station_dev: '',
})

function toEntry(form: FormState): ManualDonationEntry {
  const dynamic: Record<string, number> = {}
  if (Number(form.camp_meeting) > 0) dynamic.camp_meeting = Number(form.camp_meeting)
  if (Number(form.evangelism_local) > 0) dynamic.evangelism_local = Number(form.evangelism_local)
  if (Number(form.station_dev) > 0) dynamic.station_dev = Number(form.station_dev)

  return {
    donor_name: form.donor_name.trim(),
    phone_number: form.phone_number.trim() || undefined,
    member_status: form.member_status,
    transaction_date: form.transaction_date,
    tithe: Number(form.tithe) || undefined,
    offering: Number(form.offering) || undefined,
    church_development: Number(form.church_development) || undefined,
    evangelism: Number(form.evangelism) || undefined,
    dynamic_categories: Object.keys(dynamic).length > 0 ? dynamic : undefined,
  }
}

function entryTotal(e: ManualDonationEntry): number {
  return (
    (e.tithe ?? 0) +
    (e.offering ?? 0) +
    (e.local_budget ?? 0) +
    (e.church_development ?? 0) +
    (e.evangelism ?? 0) +
    Object.values(e.dynamic_categories ?? {}).reduce((s, v) => s + v, 0)
  )
}

function formTotal(form: FormState): number {
  return (
    Number(form.tithe || 0) +
    Number(form.offering || 0) +
    Number(form.camp_meeting || 0) +
    Number(form.church_development || 0) +
    Number(form.evangelism || 0) +
    Number(form.evangelism_local || 0) +
    Number(form.station_dev || 0)
  )
}

export default function ManualDonationPage() {
  const activeChurchId = useChurchStore((s) => s.activeChurchId)
  const currentUser = useAuthStore((s) => s.user)
  const nameRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>(emptyForm())
  const [batch, setBatch] = useState<ManualDonationEntry[]>([])
  const [formError, setFormError] = useState('')

  const adminsQuery = useQuery({
    queryKey: ['churches', activeChurchId, 'admins'],
    queryFn: () => getChurchAdmins(activeChurchId!),
    enabled: !!activeChurchId,
  })

  const myEntry = adminsQuery.data?.admins.find((a) => a.user_id === currentUser?.id)
  const hasPermission = myEntry?.is_owner || myEntry?.can_record_manual_donations || false

  const submitMutation = useMutation({
    mutationFn: () => submitManualDonations(activeChurchId!, batch),
    onSuccess: (data) => {
      toast({ title: `${data.created} donation(s) recorded and queued for Sheets` })
      setBatch([])
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to submit', description: err.message, variant: 'destructive' })
    },
  })

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const currentTotal = useMemo(() => formTotal(form), [form])

  function addToBatch() {
    setFormError('')
    if (!form.donor_name.trim()) {
      setFormError('Donor name is required')
      nameRef.current?.focus()
      return
    }
    if (currentTotal <= 0) {
      setFormError('Enter at least one donation amount')
      return
    }
    setBatch((prev) => [...prev, toEntry(form)])
    setForm((prev) => ({ ...emptyForm(), transaction_date: prev.transaction_date }))
    nameRef.current?.focus()
  }

  function removeFromBatch(idx: number) {
    setBatch((prev) => prev.filter((_, i) => i !== idx))
  }

  const batchTotal = useMemo(() => batch.reduce((s, e) => s + entryTotal(e), 0), [batch])

  if (!activeChurchId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manual Entry" />
        <p className="text-sm text-muted-foreground">Select a church from the top bar to continue.</p>
      </div>
    )
  }

  if (adminsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manual Entry" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manual Entry" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You don't have permission to record manual donations. Ask your church owner to enable
              the <strong>Manual entry</strong> permission for your account.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual Entry"
        description="Enter cash / envelope donations — fill one envelope at a time then Submit All"
      />

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Envelope Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Donor info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="donor_name">Donor Name *</Label>
              <Input
                id="donor_name"
                ref={nameRef}
                autoFocus
                placeholder="e.g. John Kamau"
                value={form.donor_name}
                onChange={set('donor_name')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone_number">Phone (optional)</Label>
              <Input
                id="phone_number"
                placeholder="0712345678"
                value={form.phone_number}
                onChange={set('phone_number')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="member_status">Status</Label>
              <select
                id="member_status"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.member_status}
                onChange={set('member_status')}
              >
                <option value="visitor">Visitor</option>
                <option value="member">Member</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="transaction_date">Date</Label>
              <Input
                id="transaction_date"
                type="date"
                value={form.transaction_date}
                onChange={set('transaction_date')}
              />
            </div>
          </div>

          {/* Row 3: Donation categories matching the SDA envelope */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="tithe">God's Tithe (10%)</Label>
              <Input
                id="tithe"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.tithe}
                onChange={set('tithe')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="offering">Combined Offering (10%+)</Label>
              <Input
                id="offering"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.offering}
                onChange={set('offering')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="camp_meeting">Camp Meeting</Label>
              <Input
                id="camp_meeting"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.camp_meeting}
                onChange={set('camp_meeting')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="church_development">Church Building/Dev.</Label>
              <Input
                id="church_development"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.church_development}
                onChange={set('church_development')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="evangelism">Evangelism — Field</Label>
              <Input
                id="evangelism"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.evangelism}
                onChange={set('evangelism')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="evangelism_local">Evangelism — Local</Label>
              <Input
                id="evangelism_local"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.evangelism_local}
                onChange={set('evangelism_local')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="station_dev">Station Dev. Fund</Label>
              <Input
                id="station_dev"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={form.station_dev}
                onChange={set('station_dev')}
                onKeyDown={(e) => { if (e.key === 'Enter') addToBatch() }}
              />
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex items-center gap-4">
            <Button type="button" onClick={addToBatch}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Envelope
            </Button>
            {currentTotal > 0 && (
              <span className="text-sm text-muted-foreground">
                Total: <strong>{formatCurrency(currentTotal)}</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Table */}
      {batch.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              Batch ({batch.length} envelope{batch.length !== 1 ? 's' : ''}) — Total:{' '}
              {formatCurrency(batchTotal)}
            </CardTitle>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? 'Submitting…' : 'Submit All'}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tithe</TableHead>
                    <TableHead className="text-right">Offering</TableHead>
                    <TableHead className="text-right">Camp Mtg</TableHead>
                    <TableHead className="text-right">Church Dev</TableHead>
                    <TableHead className="text-right">Evang. Field</TableHead>
                    <TableHead className="text-right">Evang. Local</TableHead>
                    <TableHead className="text-right">Station Dev</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.map((entry, idx) => {
                    const dyn = entry.dynamic_categories ?? {}
                    return (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap text-xs">{entry.transaction_date ?? ''}</TableCell>
                        <TableCell className="font-medium">{entry.donor_name}</TableCell>
                        <TableCell className="capitalize text-xs">{entry.member_status}</TableCell>
                        <TableCell className="text-right text-xs">{entry.tithe ? formatCurrency(entry.tithe) : '—'}</TableCell>
                        <TableCell className="text-right text-xs">{entry.offering ? formatCurrency(entry.offering) : '—'}</TableCell>
                        <TableCell className="text-right text-xs">{dyn.camp_meeting ? formatCurrency(dyn.camp_meeting) : '—'}</TableCell>
                        <TableCell className="text-right text-xs">{entry.church_development ? formatCurrency(entry.church_development) : '—'}</TableCell>
                        <TableCell className="text-right text-xs">{entry.evangelism ? formatCurrency(entry.evangelism) : '—'}</TableCell>
                        <TableCell className="text-right text-xs">{dyn.evangelism_local ? formatCurrency(dyn.evangelism_local) : '—'}</TableCell>
                        <TableCell className="text-right text-xs">{dyn.station_dev ? formatCurrency(dyn.station_dev) : '—'}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{formatCurrency(entryTotal(entry))}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromBatch(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
