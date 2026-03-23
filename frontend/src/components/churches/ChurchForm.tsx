import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createChurch, updateChurch } from '@/api/churches'
import type { Church, CreateChurchPayload } from '@/types/church'

interface Props {
  church?: Church
  onSuccess?: (church: Church) => void
}

export function ChurchForm({ church, onSuccess }: Props) {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [form, setForm] = useState<CreateChurchPayload>({
    name: church?.name ?? '',
    code: church?.code ?? '',
    description: church?.description ?? '',
    address: church?.address ?? '',
    city: church?.city ?? '',
    country: church?.country ?? 'Kenya',
    phone: church?.phone ?? '',
    email: church?.email ?? '',
    logo_url: church?.logo_url ?? '',
    primary_color: church?.primary_color ?? '#3B82F6',
    template_name: church?.template_name ?? '',
    template_language: church?.template_language ?? 'en',
    mpesa_shortcode: church?.mpesa_shortcode ?? '',
    mpesa_account_reference: church?.mpesa_account_reference ?? '',
    admin_emails: church?.admin_emails ?? [],
    setup_sheets: false,
  })

  // admin_emails as comma-separated string for the input
  const [adminEmailsRaw, setAdminEmailsRaw] = useState(
    (church?.admin_emails ?? []).join(', ')
  )

  const set = (key: keyof CreateChurchPayload, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }))

  const mutation = useMutation({
    mutationFn: () => {
      const emails = adminEmailsRaw
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
      return church
        ? updateChurch(church.id, { ...form, admin_emails: emails })
        : createChurch({ ...form, admin_emails: emails })
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['churches'] })
      if (onSuccess) {
        onSuccess(data)
      } else {
        navigate(`/churches/${data.id}`)
      }
    },
  })

  const errorMsg = (() => {
    if (!mutation.isError) return null
    const err = mutation.error as { response?: { data?: { error?: string } }; message?: string }
    return err?.response?.data?.error ?? err?.message ?? 'Failed to save church.'
  })()

  const isNew = !church

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
    >
      {/* Basic info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Church Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="code">Church Code *</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toLowerCase())}
              required
              placeholder="e.g. karengata"
              disabled={!!church}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location</h3>
        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={form.country} onChange={(e) => set('country', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+254722..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Branding</h3>
        <div className="space-y-1">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input id="logo_url" type="url" value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="primary_color">Primary Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="primary_color_picker"
              type="color"
              value={form.primary_color}
              onChange={(e) => set('primary_color', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border p-0.5"
            />
            <Input
              id="primary_color"
              value={form.primary_color}
              onChange={(e) => set('primary_color', e.target.value)}
              placeholder="#3B82F6"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* M-Pesa */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">M-Pesa</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="mpesa_shortcode">Shortcode</Label>
            <Input id="mpesa_shortcode" value={form.mpesa_shortcode} onChange={(e) => set('mpesa_shortcode', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mpesa_account_reference">Account Reference</Label>
            <Input id="mpesa_account_reference" value={form.mpesa_account_reference} onChange={(e) => set('mpesa_account_reference', e.target.value)} />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">WhatsApp</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="template_name">Template Name</Label>
            <Input id="template_name" value={form.template_name} onChange={(e) => set('template_name', e.target.value)} placeholder="church_donation_template" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="template_language">Template Language</Label>
            <Input id="template_language" value={form.template_language} onChange={(e) => set('template_language', e.target.value)} placeholder="en" />
          </div>
        </div>
      </div>

      {/* Admin & Sheets */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Admin & Google Sheets</h3>
        <div className="space-y-1">
          <Label htmlFor="admin_emails">Admin Emails</Label>
          <Input
            id="admin_emails"
            value={adminEmailsRaw}
            onChange={(e) => setAdminEmailsRaw(e.target.value)}
            placeholder="admin@example.com, another@example.com"
          />
          <p className="text-xs text-muted-foreground">Comma-separated. These accounts get access to the Google Sheets.</p>
        </div>

        {isNew && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.setup_sheets}
              onChange={(e) => set('setup_sheets', e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <div>
              <p className="text-sm font-medium">Set up Google Sheets</p>
              <p className="text-xs text-muted-foreground">Create the donation tracking spreadsheets automatically.</p>
            </div>
          </label>
        )}
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : church ? 'Update Church' : 'Create Church'}
        </Button>
      </div>
    </form>
  )
}
