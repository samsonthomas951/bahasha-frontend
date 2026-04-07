import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FormConfig, FormConfigField } from '@/types/campaign'

const STATIC_FIELD_KEYS = ['tithe', 'offering', 'localBudget', 'churchDevelopment', 'evangelism']

const DEFAULT_FIELDS: FormConfigField[] = [
  { key: 'tithe',             label: 'Tithe',               enabled: true },
  { key: 'offering',          label: 'Offering',            enabled: true },
  { key: 'localBudget',       label: 'Local Church Budget', enabled: true },
  { key: 'churchDevelopment', label: 'Church Development',  enabled: true },
  { key: 'evangelism',        label: 'Evangelism',          enabled: true },
]

function isDefault(fields: FormConfigField[], title?: string): boolean {
  if (title) return false
  if (fields.length !== DEFAULT_FIELDS.length) return false
  return DEFAULT_FIELDS.every((d, i) => {
    const f = fields[i]
    return f && f.key === d.key && f.label === d.label && f.enabled === d.enabled
  })
}

interface FormConfigBuilderProps {
  value: FormConfig | null
  onChange: (config: FormConfig | null) => void
}

export function FormConfigBuilder({ value, onChange }: FormConfigBuilderProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [fields, setFields] = useState<FormConfigField[]>([...DEFAULT_FIELDS])
  const [newFieldLabel, setNewFieldLabel] = useState('')

  // Sync from parent value when it's first set (e.g. edit mode)
  useEffect(() => {
    if (value) {
      setTitle(value.title ?? '')
      setFields(value.fields.length > 0 ? value.fields : [...DEFAULT_FIELDS])
    }
  }, [])

  function emit(nextFields: FormConfigField[], nextTitle: string) {
    if (isDefault(nextFields, nextTitle)) {
      onChange(null)
    } else {
      onChange({ title: nextTitle || undefined, fields: nextFields })
    }
  }

  function toggleField(idx: number) {
    const next = fields.map((f, i) => i === idx ? { ...f, enabled: !f.enabled } : f)
    setFields(next)
    emit(next, title)
  }

  function updateLabel(idx: number, label: string) {
    const next = fields.map((f, i) => i === idx ? { ...f, label } : f)
    setFields(next)
    emit(next, title)
  }

  function addCustomField() {
    const label = newFieldLabel.trim()
    if (!label) return
    // Derive a camelCase key from the label
    const key = label.toLowerCase().replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/\s/g, '')
    if (STATIC_FIELD_KEYS.includes(key) || fields.some((f) => f.key === key)) return
    const next = [...fields, { key, label, enabled: true }]
    setFields(next)
    setNewFieldLabel('')
    emit(next, title)
  }

  function removeCustomField(idx: number) {
    const next = fields.filter((_, i) => i !== idx)
    setFields(next)
    emit(next, title)
  }

  function updateTitle(t: string) {
    setTitle(t)
    emit(fields, t)
  }

  function resetToDefault() {
    setTitle('')
    setFields([...DEFAULT_FIELDS])
    onChange(null)
  }

  const enabledCount = fields.filter((f) => f.enabled).length

  return (
    <div className="rounded-md border border-dashed">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <span>
          Customize Donation Form
          {value && (
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {enabledCount} field{enabledCount !== 1 ? 's' : ''}
            </span>
          )}
          {!value && <span className="ml-2 text-xs opacity-60">(optional)</span>}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          {/* Form title override */}
          <div className="space-y-1">
            <Label className="text-xs">Form subtitle (optional override)</Label>
            <Input
              placeholder={`e.g. "Camp Meeting Offering"`}
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Replaces the default &ldquo;[Church] WhatsApp Envelope&rdquo; text shown on the form.
            </p>
          </div>

          {/* Field toggles */}
          <div className="space-y-1">
            <Label className="text-xs">Fields shown on the form</Label>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`fcb-${field.key}`}
                    checked={field.enabled}
                    onChange={() => toggleField(idx)}
                    className="h-4 w-4 shrink-0 rounded border"
                  />
                  <Input
                    value={field.label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    className="h-8 flex-1 text-sm"
                    disabled={!field.enabled}
                  />
                  {!STATIC_FIELD_KEYS.includes(field.key) && (
                    <button
                      type="button"
                      onClick={() => removeCustomField(idx)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add custom field */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a custom field label…"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomField() } }}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomField}
              disabled={!newFieldLabel.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <button
            type="button"
            onClick={resetToDefault}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Reset to default form
          </button>
        </div>
      )}
    </div>
  )
}
