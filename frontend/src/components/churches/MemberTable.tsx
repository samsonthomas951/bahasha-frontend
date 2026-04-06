import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { addChurchMember, removeChurchMember } from '@/api/churches'
import { ImportMembersDialog } from './ImportMembersDialog'
import type { ChurchMember } from '@/types/church'

interface Props {
  churchId: number
  members: ChurchMember[]
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export function MemberTable({ churchId, members, page, totalPages, total, onPageChange }: Props) {
  const qc = useQueryClient()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const PAGE_SIZE = 50
  const pageMembers = members

  const addMutation = useMutation({
    mutationFn: () => addChurchMember(churchId, phone, name || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches', churchId, 'members'] })
      setPhone('')
      setName('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (phoneNumber: string) => removeChurchMember(churchId, phoneNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['churches', churchId, 'members'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="+254700000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-48"
        />
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={!phone || addMutation.isPending}
        >
          <Plus className="mr-1 h-4 w-4" />
          {addMutation.isPending ? 'Adding…' : 'Add'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="mr-1 h-4 w-4" />
          Import CSV / Excel
        </Button>
      </div>

      {addMutation.isError && (
        <p className="text-sm text-destructive">
          {(addMutation.error as Error)?.message ?? 'Failed to add member'}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No members assigned
              </TableCell>
            </TableRow>
          ) : (
            pageMembers.map((m) => (
              <TableRow key={m.phone_number}>
                <TableCell className="font-mono text-sm">{m.phone_number}</TableCell>
                <TableCell>{m.name ?? '—'}</TableCell>
                <TableCell>{m.member_status ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeMutation.mutate(m.phone_number)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} members
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ImportMembersDialog
        churchId={churchId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  )
}
