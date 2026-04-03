import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { bulkAddChurchGroupMembers } from '@/api/church-groups'

interface Props {
  churchId: number
  groupId: number
}

export function BulkImportDialog({ churchId, groupId }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<{ added: number; already_in_group: number; not_church_member: number } | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const phones = raw
        .split('\n')
        .map((line) => line.split(',')[0].trim())
        .filter(Boolean)
      return bulkAddChurchGroupMembers(churchId, groupId, phones)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['church-groups', churchId, groupId, 'members'] })
      qc.invalidateQueries({ queryKey: ['church-groups', churchId] })
      setResult({ added: data.added, already_in_group: data.already_in_group, not_church_member: data.not_church_member })
      setRaw('')
    },
  })

  const handleClose = (v: boolean) => {
    setOpen(v)
    if (!v) { setRaw(''); setResult(null) }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Add Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {result ? (
            <div className="space-y-2 rounded-md border p-4 text-sm">
              <p className="font-medium">Import complete</p>
              <p className="text-green-700">Added: {result.added}</p>
              {result.already_in_group > 0 && (
                <p className="text-muted-foreground">Already in group: {result.already_in_group}</p>
              )}
              {result.not_church_member > 0 && (
                <p className="text-yellow-700">
                  Not a church member (skipped): {result.not_church_member}
                </p>
              )}
              <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                Import more
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Phone numbers (one per line — must already be church members)</Label>
                <Textarea
                  placeholder={'+254700000001\n+254700000002, John Doe\n+254700000003'}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={8}
                />
              </div>
              {mutation.isError && (
                <p className="text-sm text-destructive">Failed to import members</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={!raw.trim() || mutation.isPending}
                >
                  {mutation.isPending ? 'Importing…' : 'Import'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
