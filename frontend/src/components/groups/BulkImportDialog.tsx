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
import { bulkAddMembers } from '@/api/groups'

interface Props {
  groupId: number
}

export function BulkImportDialog({ groupId }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const members = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [phone, ...nameParts] = line.split(',')
          return { phone_number: phone.trim(), name: nameParts.join(',').trim() || undefined }
        })
      return bulkAddMembers(groupId, members)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'members'] })
      setOpen(false)
      setRaw('')
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Import Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Phone numbers (one per line, optional name after comma)</Label>
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={!raw.trim() || mutation.isPending}>
              {mutation.isPending ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
