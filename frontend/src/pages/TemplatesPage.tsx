import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listAdminTemplates,
  createWaTemplate,
  deleteWaTemplate,
  type WaTemplate,
  type CreateTemplatePayload,
  type ButtonDef,
  type AuthConfig,
} from '@/api/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  LayoutTemplate,
  Plus,
  Trash2,
  PhoneCall,
  Link,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

// ─── Constants ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'en', label: 'English' },
  { value: 'sw', label: 'Swahili' },
  { value: 'fr', label: 'French' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'es', label: 'Spanish' },
  { value: 'zu', label: 'Zulu' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yoruba' },
]

const CATEGORIES = [
  {
    value: 'MARKETING',
    label: 'Marketing',
    description: 'Promotions, events, announcements, campaigns',
  },
  {
    value: 'UTILITY',
    label: 'Utility',
    description: 'Donation receipts, reminders, confirmations',
  },
  {
    value: 'AUTHENTICATION',
    label: 'Authentication',
    description: 'OTP codes and identity verification',
  },
]

const HEADER_TYPES = [
  { value: 'none', label: 'No header' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractVars(text: string): string[] {
  const matches = Array.from(text.matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g))
  return [...new Set(matches.map((m) => m[1]))]
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toUpperCase()) {
    case 'APPROVED': return 'default'
    case 'PENDING': return 'secondary'
    case 'REJECTED': return 'destructive'
    default: return 'outline'
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toUpperCase()) {
    case 'APPROVED': return <CheckCircle2 className="h-3.5 w-3.5" />
    case 'PENDING': return <Clock className="h-3.5 w-3.5" />
    case 'REJECTED': return <XCircle className="h-3.5 w-3.5" />
    default: return <AlertCircle className="h-3.5 w-3.5" />
  }
}

function categoryColor(category: string) {
  switch (category.toUpperCase()) {
    case 'MARKETING': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'UTILITY': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'AUTHENTICATION': return 'bg-orange-100 text-orange-700 border-orange-200'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ─── Default form state ────────────────────────────────────────────────────

function defaultForm(): CreateTemplatePayload {
  return {
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    header: { type: 'none', text: '', example_url: '', examples: {} },
    body: { text: '', examples: {} },
    footer: '',
    buttons: [],
    auth_config: {
      add_security_recommendation: true,
      code_expiration_minutes: 5,
      otp_button_text: 'Copy Code',
    },
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WaTemplate | null>(null)
  const [form, setForm] = useState<CreateTemplatePayload>(defaultForm())
  const [error, setError] = useState('')

  const templatesQuery = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: listAdminTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createWaTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] })
      // also invalidate campaign templates so church admins see it after approval
      qc.invalidateQueries({ queryKey: ['templates'] })
      setSheetOpen(false)
      setForm(defaultForm())
      setError('')
    },
    onError: (e: Error) => setError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWaTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'templates'] })
      setDeleteTarget(null)
    },
  })

  // Derived variables from body and header text
  const bodyVars = useMemo(() => extractVars(form.body.text), [form.body.text])
  const headerVars = useMemo(
    () => (form.header?.type === 'text' ? extractVars(form.header.text ?? '') : []),
    [form.header],
  )

  // ── Helpers to update nested state ─────────────────────────────────────

  const setHeader = (patch: Partial<NonNullable<CreateTemplatePayload['header']>>) =>
    setForm((f) => ({ ...f, header: { ...f.header!, ...patch } }))

  const setBody = (patch: Partial<CreateTemplatePayload['body']>) =>
    setForm((f) => ({ ...f, body: { ...f.body, ...patch } }))

  const setHeaderExample = (key: string, val: string) =>
    setForm((f) => ({
      ...f,
      header: { ...f.header!, examples: { ...f.header!.examples, [key]: val } },
    }))

  const setBodyExample = (key: string, val: string) =>
    setForm((f) => ({
      ...f,
      body: { ...f.body, examples: { ...f.body.examples, [key]: val } },
    }))

  const addButton = (type: ButtonDef['type']) =>
    setForm((f) => ({
      ...f,
      buttons: [
        ...(f.buttons ?? []),
        type === 'url'
          ? { type, text: '', url: '', url_example: '' }
          : type === 'phone'
          ? { type, text: '', phone_number: '' }
          : { type, text: '' },
      ],
    }))

  const updateButton = (idx: number, patch: Partial<ButtonDef>) =>
    setForm((f) => ({
      ...f,
      buttons: (f.buttons ?? []).map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }))

  const removeButton = (idx: number) =>
    setForm((f) => ({ ...f, buttons: (f.buttons ?? []).filter((_, i) => i !== idx) }))

  const setAuthConfig = (patch: Partial<AuthConfig>) =>
    setForm((f) => ({ ...f, auth_config: { ...f.auth_config, ...patch } }))

  const isAuth = form.category === 'AUTHENTICATION'

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    setError('')
    if (!form.name.trim()) return setError('Template name is required.')

    if (isAuth) {
      // Authentication templates use Meta's fixed content — only validate OTP label
      const label = form.auth_config?.otp_button_text?.trim() ?? ''
      if (!label) return setError('OTP button label is required.')
    } else {
      if (!form.body.text.trim()) return setError('Body text is required.')
      if (form.header?.type === 'text' && !form.header.text?.trim())
        return setError('Header text is required when header type is Text.')
      if (
        ['image', 'video', 'document'].includes(form.header?.type ?? '') &&
        !form.header?.example_url?.trim()
      )
        return setError('An example URL is required for media headers.')
    }

    // Auto-fill any missing example values with a placeholder
    const bodyExamples = { ...form.body.examples }
    bodyVars.forEach((v) => { if (!bodyExamples[v]) bodyExamples[v] = v })
    const headerExamples = { ...form.header?.examples }
    headerVars.forEach((v) => { if (!headerExamples[v]) headerExamples[v] = v })

    createMutation.mutate({
      ...form,
      body: { ...form.body, examples: bodyExamples },
      header: { ...form.header!, examples: headerExamples },
    })
  }

  const templates = templatesQuery.data ?? []
  const approved = templates.filter((t) => t.status.toUpperCase() === 'APPROVED').length
  const pending = templates.filter((t) => t.status.toUpperCase() === 'PENDING').length
  const rejected = templates.filter((t) => t.status.toUpperCase() === 'REJECTED').length
  const urlButtonCount = (form.buttons ?? []).filter((b) => b.type === 'url').length
  const phoneButtonCount = (form.buttons ?? []).filter((b) => b.type === 'phone').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Templates"
        description="Create and manage reusable message templates for church admin campaigns"
        action={
          <Button onClick={() => { setSheetOpen(true); setForm(defaultForm()); setError('') }}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Approved', value: approved, color: 'text-green-600' },
          { label: 'Pending Review', value: pending, color: 'text-yellow-600' },
          { label: 'Rejected', value: rejected, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              {templatesQuery.isLoading
                ? <Skeleton className="mt-1 h-7 w-8" />
                : <p className={`text-2xl font-bold ${color}`}>{value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            All Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templatesQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <LayoutTemplate className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No templates yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.language}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${categoryColor(t.category)}`}>
                      {t.category}
                    </span>
                    <Badge variant={statusVariant(t.status)} className="gap-1 text-[11px]">
                      <StatusIcon status={t.status} />
                      {t.status}
                    </Badge>
                    {t.rejected_reason && (
                      <span className="text-[11px] text-destructive truncate max-w-[200px]" title={t.rejected_reason}>
                        {t.rejected_reason}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0 ml-2"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Template Sheet ──────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto" side="right">
          <SheetHeader className="mb-4">
            <SheetTitle>Create WhatsApp Template</SheetTitle>
            <SheetDescription>
              Templates are reviewed by Meta before becoming available. Approved templates can be used
              in campaigns by church admins.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">

            {/* ── 1. Identity ─────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                1 · Template Identity
              </h3>

              <div className="space-y-1">
                <Label htmlFor="tpl-name">Template name <span className="text-destructive">*</span></Label>
                <Input
                  id="tpl-name"
                  placeholder="e.g. sunday_service_invite"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Lowercase letters, numbers and underscores only.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => {
                      const cat = v as CreateTemplatePayload['category']
                      setForm((f) => ({
                        ...f,
                        category: cat,
                        // Reset category-specific fields to avoid leaking stale data
                        ...(cat === 'AUTHENTICATION'
                          ? { header: { type: 'none', text: '', example_url: '', examples: {} }, body: { text: '', examples: {} }, footer: '', buttons: [] }
                          : { auth_config: { add_security_recommendation: true, code_expiration_minutes: 5, otp_button_text: 'Copy Code' } }
                        ),
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="font-medium">{c.label}</span>
                          <span className="ml-1 text-muted-foreground text-xs hidden sm:inline">
                            — {c.description}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Language <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.language}
                    onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            {/* ── Authentication info banner ────────────────────────────── */}
            {isAuth && (
              <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 flex gap-2 text-[11px] text-orange-800">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                <div>
                  <p className="font-semibold mb-0.5">Authentication template — fixed format</p>
                  <p>Meta controls the message body. Configure the security options and OTP button below. Headers, custom footers, and non-OTP buttons are not supported.</p>
                </div>
              </div>
            )}

            {/* ── 2. Header (hidden for Authentication) ────────────────── */}
            {!isAuth && (
              <>
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    2 · Header <span className="font-normal normal-case text-muted-foreground">(optional)</span>
                  </h3>

                  <div className="space-y-1">
                    <Label>Header type</Label>
                    <Select
                      value={form.header?.type ?? 'none'}
                      onValueChange={(v) => setHeader({ type: v as NonNullable<CreateTemplatePayload['header']>['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HEADER_TYPES.map((h) => (
                          <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.header?.type === 'text' && (
                    <div className="space-y-1">
                      <Label>Header text</Label>
                      <Input
                        placeholder="e.g. Hello {{church_name}}!"
                        value={form.header.text ?? ''}
                        onChange={(e) => setHeader({ text: e.target.value })}
                      />
                      {headerVars.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Example values for variables
                          </p>
                          {headerVars.map((v) => (
                            <div key={v} className="flex items-center gap-2">
                              <code className="text-xs bg-muted rounded px-1.5 py-0.5 w-28 shrink-0">{`{{${v}}}`}</code>
                              <Input
                                className="h-7 text-xs"
                                placeholder={`Example for ${v}`}
                                value={form.header?.examples?.[v] ?? ''}
                                onChange={(e) => setHeaderExample(v, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {['image', 'video', 'document'].includes(form.header?.type ?? '') && (
                    <div className="space-y-1">
                      <Label>Example URL <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="https://example.com/sample.jpg"
                        value={form.header?.example_url ?? ''}
                        onChange={(e) => setHeader({ example_url: e.target.value })}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        A public URL Meta uses to preview the template. The real URL is set per campaign send.
                      </p>
                    </div>
                  )}
                </section>

                <Separator />
              </>
            )}

            {/* ── 3. Body (custom for Marketing/Utility · fixed for Auth) ── */}
            {isAuth ? (
              <>
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    2 · Security options
                  </h3>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                      checked={form.auth_config?.add_security_recommendation ?? true}
                      onChange={(e) => setAuthConfig({ add_security_recommendation: e.target.checked })}
                    />
                    <span className="text-sm">
                      Add security recommendation
                      <span className="block text-[11px] text-muted-foreground font-normal">
                        Appends "For your security, do not share this code."
                      </span>
                    </span>
                  </label>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    3 · Code expiration <span className="font-normal normal-case text-muted-foreground">(optional)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      className="w-24"
                      placeholder="e.g. 5"
                      value={form.auth_config?.code_expiration_minutes ?? ''}
                      onChange={(e) => setAuthConfig({
                        code_expiration_minutes: e.target.value ? parseInt(e.target.value) : null,
                      })}
                    />
                    <span className="text-sm text-muted-foreground">minutes (1–90)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The OTP button is disabled after this many minutes. Leave blank to use WhatsApp's default (10 min).
                  </p>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    4 · OTP button label <span className="text-destructive">*</span>
                  </h3>
                  <Input
                    maxLength={25}
                    placeholder="Copy Code"
                    value={form.auth_config?.otp_button_text ?? ''}
                    onChange={(e) => setAuthConfig({ otp_button_text: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Label on the copy-code button. Max 25 characters.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    3 · Body <span className="text-destructive">*</span>
                  </h3>
                  <div className="space-y-1">
                    <Label htmlFor="tpl-body">Message text</Label>
                    <Textarea
                      id="tpl-body"
                      rows={5}
                      placeholder={`Hello {{name}}, you're invited to {{church_name}}'s upcoming service on {{date}}. We'd love to see you! 🙏`}
                      value={form.body.text}
                      onChange={(e) => setBody({ text: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use <code className="bg-muted px-1 rounded">{'{{variable_name}}'}</code> for personalised fields. Campaign senders will fill these in when they send.
                    </p>
                  </div>

                  {bodyVars.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Example values (required by Meta for template review)
                      </p>
                      {bodyVars.map((v) => (
                        <div key={v} className="flex items-center gap-2">
                          <code className="text-xs bg-muted rounded px-1.5 py-0.5 w-28 shrink-0">{`{{${v}}}`}</code>
                          <Input
                            className="h-7 text-xs"
                            placeholder={`Example for ${v}`}
                            value={form.body.examples?.[v] ?? ''}
                            onChange={(e) => setBodyExample(v, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <Separator />

                {/* ── 4. Footer ──────────────────────────────────────────── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    4 · Footer <span className="font-normal normal-case text-muted-foreground">(optional · max 60 chars)</span>
                  </h3>
                  <Input
                    maxLength={60}
                    placeholder="e.g. God bless you. — Bahasha"
                    value={form.footer ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))}
                  />
                  <p className="text-right text-[11px] text-muted-foreground">
                    {(form.footer ?? '').length}/60
                  </p>
                </section>

                <Separator />

                {/* ── 5. Buttons ─────────────────────────────────────────── */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      5 · Buttons <span className="font-normal normal-case">(optional · max 10)</span>
                    </h3>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={(form.buttons?.length ?? 0) >= 10}
                        onClick={() => addButton('quick_reply')}
                      >
                        <MessageSquare className="h-3 w-3" />
                        Reply
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={urlButtonCount >= 2}
                        onClick={() => addButton('url')}
                      >
                        <Link className="h-3 w-3" />
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={phoneButtonCount >= 1}
                        onClick={() => addButton('phone')}
                      >
                        <PhoneCall className="h-3 w-3" />
                        Phone
                      </Button>
                    </div>
                  </div>

                  {(form.buttons ?? []).length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      No buttons added. Quick Reply lets members respond. URL opens a link. Phone dials a number.
                    </p>
                  )}

                  <div className="space-y-2">
                    {(form.buttons ?? []).map((btn, idx) => (
                      <div key={idx} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium capitalize text-muted-foreground">
                            {btn.type === 'quick_reply' ? 'Quick Reply' : btn.type === 'url' ? 'URL Button' : 'Phone Button'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeButton(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Button label <span className="text-muted-foreground">(max 25 chars)</span></Label>
                          <Input
                            className="h-7 text-xs"
                            maxLength={25}
                            placeholder={
                              btn.type === 'quick_reply' ? "e.g. I'll attend" :
                              btn.type === 'url' ? 'e.g. Visit Website' : 'e.g. Call Us'
                            }
                            value={btn.text}
                            onChange={(e) => updateButton(idx, { text: e.target.value })}
                          />
                        </div>

                        {btn.type === 'url' && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">URL</Label>
                              <Input
                                className="h-7 text-xs"
                                placeholder="https://example.com/donate?ref={{1}}"
                                value={btn.url ?? ''}
                                onChange={(e) => updateButton(idx, { url: e.target.value })}
                              />
                              <p className="text-[10px] text-muted-foreground">
                                You can add one variable at the end: <code>{'{{1}}'}</code>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Example URL (for Meta review)</Label>
                              <Input
                                className="h-7 text-xs"
                                placeholder="https://example.com/donate?ref=SAMPLE"
                                value={btn.url_example ?? ''}
                                onChange={(e) => updateButton(idx, { url_example: e.target.value })}
                              />
                            </div>
                          </>
                        )}

                        {btn.type === 'phone' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Phone number</Label>
                            <Input
                              className="h-7 text-xs"
                              placeholder="+254712345678"
                              value={btn.phone_number ?? ''}
                              onChange={(e) => updateButton(idx, { phone_number: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Error & Submit */}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2 pb-6">
              <Button
                className="flex-1"
                disabled={createMutation.isPending}
                onClick={handleSubmit}
              >
                {createMutation.isPending ? 'Submitting…' : 'Submit for Review'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setSheetOpen(false); setError('') }}
              >
                Cancel
              </Button>
            </div>

            <div className="rounded-md bg-muted/50 border px-3 py-2.5 text-[11px] text-muted-foreground">
              <strong>Note:</strong> Meta typically reviews templates within 24 hours. Once
              <strong> Approved</strong>, church admins can select this template when creating campaigns.
              Rejected templates show a reason you can use to revise and resubmit.
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> from Meta. Church
              admins won't be able to use it in campaigns anymore. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.name)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
