import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createChurchGroup, updateChurchGroup } from '@/api/church-groups'
import type { ChurchGroup, CreateChurchGroupPayload } from '@/types/church-group'

interface Props {
  churchId: number
  group?: ChurchGroup
  onSuccess?: () => void
}

export function GroupForm({ churchId, group, onSuccess }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<CreateChurchGroupPayload>({
    code: group?.code ?? '',
    name: group?.name ?? '',
    description: group?.description ?? '',
    color: group?.color ?? '',
    icon: group?.icon ?? '',
  })

  const set = (key: keyof CreateChurchGroupPayload, val: string) =>
    setForm((f) => ({ ...f, [key]: val }))

  const mutation = useMutation({
    mutationFn: () =>
      group
        ? updateChurchGroup(churchId, group.id, form)
        : createChurchGroup(churchId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-groups', churchId] })
      onSuccess?.()
    },
  })

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="g-code">Code *</Label>
          <Input
            id="g-code"
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            required
            placeholder="e.g. YOUTH"
            disabled={!!group}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-name">Name *</Label>
          <Input
            id="g-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            placeholder="e.g. Youth Ministry"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="g-description">Description</Label>
        <Textarea
          id="g-description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="g-icon">Icon (emoji)</Label>
          <Input
            id="g-icon"
            value={form.icon}
            onChange={(e) => set('icon', e.target.value)}
            placeholder="🎵"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-color">Color (hex)</Label>
          <Input
            id="g-color"
            value={form.color}
            onChange={(e) => set('color', e.target.value)}
            placeholder="#6366f1"
          />
        </div>
      </div>
      {mutation.isError && (
        <p className="text-sm text-destructive">
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to save group'}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : group ? 'Update Group' : 'Create Group'}
        </Button>
      </div>
    </form>
  )
}
