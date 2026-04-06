import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Image, Video, FileText, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCampaign, getTemplates } from '@/api/campaigns'
import { getChurch } from '@/api/churches'
import { listChurchGroups } from '@/api/church-groups'
import { useChurchStore } from '@/stores/churchStore'
import type { CreateCampaignPayload, TargetAudience, WhatsAppTemplate, TemplateParams } from '@/types/campaign'

const DEFAULT_IMAGE = 'https://images.examples.com/wp-content/uploads/2019/04/Tithes-and-Offerings-Church-Envelope.jpg'

/** Replace {{1}}, {{2}}, … in a template body with the supplied values */
function resolveBody(body: string | null, params: TemplateParams): string | null {
  if (!body) return body
  let result = body
  if (params.church_name) result = result.replace(/\{\{1\}\}/g, params.church_name)
  return result
}

// ─── WhatsApp phone mockup ────────────────────────────────────────────────────

interface PreviewProps {
  template: WhatsAppTemplate | null
  params: TemplateParams
}

function WhatsAppPreview({ template, params }: PreviewProps) {
  if (!template) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="rounded-[2.2rem] border-[5px] border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 text-muted-foreground"
          style={{ width: 240, height: 480 }}
        >
          <Smartphone className="h-10 w-10 opacity-20" />
          <p className="text-xs text-center leading-snug px-6">Select a template to<br />preview how it looks</p>
        </div>
        <p className="text-[11px] text-muted-foreground text-center leading-snug opacity-0">placeholder</p>
      </div>
    )
  }

  const { components } = template
  const hasHeader = !!components?.header
  const hasBody = !!components?.body
  const hasFooter = !!components?.footer
  const hasButtons = (components?.buttons?.length ?? 0) > 0
  const resolvedBody = resolveBody(components?.body ?? null, params)
  const imageUrl = params.image_url || DEFAULT_IMAGE

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Phone frame — fixed 240 × 480 px */}
      <div
        className="relative rounded-[2.2rem] border-[5px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 240, height: 480 }}
      >
        {/* Notch */}
        <div className="bg-gray-800 h-5 shrink-0 flex items-center justify-center">
          <div className="w-16 h-2.5 bg-gray-700 rounded-full" />
        </div>

        {/* WhatsApp header bar */}
        <div className="bg-[#075E54] shrink-0 flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
            B
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold leading-tight">Bahasha</p>
            <p className="text-white/60 text-[9px]">Business account</p>
          </div>
        </div>

        {/* Chat wallpaper — fills remaining space, scrollable */}
        <div
          className="flex-1 overflow-y-auto p-2 flex flex-col justify-end"
          style={{ background: '#e5ddd5' }}
        >
          {/* Message bubble */}
          <div className="bg-white rounded-lg rounded-tl-none shadow-sm w-[90%] overflow-hidden self-start">
            {/* Header */}
            {hasHeader && components.header?.type === 'IMAGE' && (
              <img
                src={imageUrl}
                alt="Template header"
                className="w-full h-24 object-cover"
                onError={(e) => {
                  // fallback placeholder if URL is broken
                  const t = e.currentTarget
                  t.style.display = 'none'
                  const placeholder = t.nextElementSibling as HTMLElement | null
                  if (placeholder) placeholder.style.display = 'flex'
                }}
              />
            )}
            {hasHeader && components.header?.type === 'IMAGE' && (
              <div className="bg-gray-200 h-24 items-center justify-center hidden">
                <Image className="h-7 w-7 text-gray-400" />
              </div>
            )}
            {hasHeader && components.header?.type === 'VIDEO' && (
              <div className="bg-gray-800 h-24 flex items-center justify-center">
                <Video className="h-7 w-7 text-white/70" />
              </div>
            )}
            {hasHeader && components.header?.type === 'DOCUMENT' && (
              <div className="bg-blue-50 h-14 flex items-center gap-2 px-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-[10px] text-blue-700">Document</span>
              </div>
            )}
            {hasHeader && components.header?.type === 'TEXT' && components.header.text && (
              <div className="px-3 pt-2 pb-0.5">
                <p className="text-[11px] font-bold text-gray-800 leading-snug">
                  {components.header.text}
                </p>
              </div>
            )}

            {/* Body */}
            {hasBody && (
              <div className="px-3 py-2">
                <p className="text-[11px] text-gray-800 leading-snug whitespace-pre-wrap line-clamp-6">
                  {resolvedBody}
                </p>
              </div>
            )}

            {/* Footer + timestamp */}
            <div className="px-3 pb-1.5 flex items-end justify-between gap-2">
              {hasFooter ? (
                <p className="text-[9px] text-gray-400 leading-tight line-clamp-1">{components.footer}</p>
              ) : (
                <span />
              )}
              <span className="text-[9px] text-gray-400 whitespace-nowrap flex items-center gap-0.5 shrink-0">
                10:30 AM <CheckCheck className="h-2.5 w-2.5 text-[#53BDEB]" />
              </span>
            </div>

            {/* Buttons */}
            {hasButtons && (
              <div className="border-t border-gray-100">
                {components.buttons.map((btn, i) => (
                  <div
                    key={i}
                    className={`py-1.5 px-3 text-center text-[11px] text-[#128C7E] font-medium ${
                      i < components.buttons.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {btn.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-[#f0f0f0] shrink-0 flex items-center gap-1.5 px-2 py-1.5">
          <div className="flex-1 bg-white rounded-full h-6 px-3 flex items-center">
            <span className="text-[9px] text-gray-400">Message</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center leading-snug">
        Preview — how recipients<br />will see this message
      </p>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function CampaignForm() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const activeChurchId = useChurchStore((s) => s.activeChurchId)

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['campaigns', 'templates'],
    queryFn: getTemplates,
  })

  const { data: activeChurch } = useQuery({
    queryKey: ['church', activeChurchId],
    queryFn: () => getChurch(activeChurchId!),
    enabled: !!activeChurchId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: groups } = useQuery({
    queryKey: ['church-groups', activeChurchId],
    queryFn: () => listChurchGroups(activeChurchId!),
    enabled: !!activeChurchId,
  })

  const [form, setForm] = useState<CreateCampaignPayload>({
    name: '',
    description: '',
    target_audience: 'all',
    message_template: '',
    scheduled_time: '',
    recurring: false,
    send_report: false,
    custom_recipients: [],
    group_ids: [],
  })
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [customPhones, setCustomPhones] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set())
  const [params, setParams] = useState<TemplateParams>({})

  const set = <K extends keyof CreateCampaignPayload>(key: K, val: CreateCampaignPayload[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const setParam = <K extends keyof TemplateParams>(key: K, val: TemplateParams[K]) =>
    setParams((p) => ({ ...p, [key]: val }))

  function handleTemplateChange(rawName: string) {
    set('message_template', rawName)
    const tpl = templates?.find((t) => t.id === rawName) ?? null
    setSelectedTemplate(tpl)

    // Pre-fill params from the active church when a template is selected
    const churchName = activeChurch?.name ?? ''
    const churchCode = activeChurch?.code ?? ''
    const imageUrl = activeChurch?.template_header_image || DEFAULT_IMAGE

    setParams({
      church_name: churchName,
      church_code: churchCode,
      image_url: tpl?.components?.header?.type === 'IMAGE' ? imageUrl : undefined,
    })
  }

  const hasImageHeader = selectedTemplate?.components?.header?.type === 'IMAGE'
  const bodyHasVariable = selectedTemplate?.components?.body?.includes('{{') ?? false

  const toggleGroup = (id: number) =>
    setSelectedGroups((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateCampaignPayload = { ...form, template_params: params }
      if (form.target_audience === 'custom') {
        payload.custom_recipients = customPhones
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      }
      if (form.target_audience === 'groups') {
        payload.group_ids = Array.from(selectedGroups)
      }
      return createCampaign(payload)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      navigate(`/campaigns/${data.id}`)
    },
  })

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">
      {/* ── Left: form fields ── */}
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}>
        <div className="space-y-1">
          <Label htmlFor="c-name">Campaign Name *</Label>
          <Input
            id="c-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="c-desc">Description</Label>
          <Textarea
            id="c-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
          />
        </div>

        {/* Template selector */}
        <div className="space-y-1">
          <Label>Message Template *</Label>
          {templatesLoading ? (
            <div className="h-9 rounded-md border bg-muted animate-pulse" />
          ) : templates && templates.length > 0 ? (
            <>
              <Select value={form.message_template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="font-medium">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.language} · {t.category?.replace('TEMPLATECATEGORY.', '')}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  Template ID: <span className="font-mono">{selectedTemplate.id}</span>
                </p>
              )}
            </>
          ) : (
            <Input
              value={form.message_template}
              onChange={(e) => set('message_template', e.target.value)}
              placeholder="Template name"
              required
            />
          )}
        </div>

        {/* ── Template parameter fields (only shown when template needs them) ── */}
        {selectedTemplate && (hasImageHeader || bodyHasVariable) && (
          <div className="rounded-md border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Template Parameters
            </p>

            {/* Church name — fills {{1}} in body */}
            {bodyHasVariable && (
              <div className="space-y-1">
                <Label htmlFor="tp-church">Church Name</Label>
                <Input
                  id="tp-church"
                  value={params.church_name ?? ''}
                  onChange={(e) => setParam('church_name', e.target.value)}
                  placeholder="e.g. Grace Baptist Church"
                />
                <p className="text-[11px] text-muted-foreground">
                  Replaces <span className="font-mono">{'{{1}}'}</span> in the message body
                </p>
              </div>
            )}

            {/* Image URL — fills the image header */}
            {hasImageHeader && (
              <div className="space-y-1">
                <Label htmlFor="tp-image">Header Image URL</Label>
                <Input
                  id="tp-image"
                  value={params.image_url ?? ''}
                  onChange={(e) => setParam('image_url', e.target.value)}
                  placeholder={DEFAULT_IMAGE}
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave as-is to use the default offering envelope image
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label>Target Audience</Label>
          <Select
            value={form.target_audience}
            onValueChange={(v) => {
              set('target_audience', v as TargetAudience)
              setSelectedGroups(new Set())
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="groups">Groups</SelectItem>
              <SelectItem value="custom">Custom list</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.target_audience === 'groups' && (
          <div className="space-y-2">
            <Label>Select Groups</Label>
            {!groups || groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups found. Create groups first.</p>
            ) : (
              <div className="rounded-md border divide-y">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.has(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="h-4 w-4 rounded border"
                    />
                    <span className="flex-1 text-sm">
                      {g.icon && <span className="mr-1">{g.icon}</span>}
                      <span className="font-medium">{g.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{g.member_count} members</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedGroups.size > 0 && (
              <p className="text-xs text-muted-foreground">{selectedGroups.size} group{selectedGroups.size !== 1 ? 's' : ''} selected</p>
            )}
          </div>
        )}

        {form.target_audience === 'custom' && (
          <div className="space-y-1">
            <Label>Phone Numbers (one per line)</Label>
            <Textarea
              value={customPhones}
              onChange={(e) => setCustomPhones(e.target.value)}
              placeholder={'+254700000001\n+254700000002'}
              rows={5}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="c-schedule">Schedule (leave blank to save as draft)</Label>
          <Input
            id="c-schedule"
            type="datetime-local"
            value={form.scheduled_time}
            onChange={(e) => set('scheduled_time', e.target.value)}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to create campaign'}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending || !form.message_template || (form.target_audience === 'groups' && selectedGroups.size === 0)}>
            {mutation.isPending ? 'Creating…' : 'Create Campaign'}
          </Button>
        </div>
      </form>

      {/* ── Right: phone preview ── */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-sm font-medium mb-4 text-center text-muted-foreground">
          Message Preview
        </p>
        <WhatsAppPreview template={selectedTemplate} params={params} />
      </div>
    </div>
  )
}
