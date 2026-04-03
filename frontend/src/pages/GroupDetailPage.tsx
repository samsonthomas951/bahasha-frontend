import { useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, UserPlus } from 'lucide-react'
import {
  getChurchGroupMembers,
  addChurchGroupMembers,
  removeChurchGroupMember,
  deleteChurchGroup,
  listChurchGroups,
} from '@/api/church-groups'
import { getChurchMembers } from '@/api/churches'
import { useChurchStore } from '@/stores/churchStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { GroupForm } from '@/components/groups/GroupForm'
import { BulkImportDialog } from '@/components/groups/BulkImportDialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const id = Number(groupId)

  // churchId comes from the ?church= query param set by GroupCard, falling back to the store
  const activeChurchId = useChurchStore((s) => s.activeChurchId)
  const churchIdParam = searchParams.get('church')
  const churchId = churchIdParam ? Number(churchIdParam) : activeChurchId

  // Search state for the "add member" picker dialog
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // ── Data queries ──────────────────────────────────────────────────────────
  const groupsQuery = useQuery({
    queryKey: ['church-groups', churchId],
    queryFn: () => listChurchGroups(churchId!),
    enabled: !!churchId,
  })
  const group = groupsQuery.data?.find((g) => g.id === id)

  const membersQuery = useQuery({
    queryKey: ['church-groups', churchId, id, 'members'],
    queryFn: () => getChurchGroupMembers(churchId!, id),
    enabled: !!churchId,
  })
  const currentMembers = membersQuery.data?.members ?? []
  const currentPhones = useMemo(
    () => new Set(currentMembers.map((m) => m.phone_number)),
    [currentMembers],
  )

  // Load all church members for the picker (up to 500; typical church size)
  const churchMembersQuery = useQuery({
    queryKey: ['churches', churchId, 'members', 1, 500],
    queryFn: () => getChurchMembers(churchId!, 1, 500),
    enabled: !!churchId && pickerOpen,
  })
  const allChurchMembers = churchMembersQuery.data?.members ?? []

  // Members not yet in this group, filtered by search
  const availableMembers = useMemo(() => {
    const q = pickerSearch.toLowerCase()
    return allChurchMembers.filter(
      (m) =>
        !currentPhones.has(m.phone_number) &&
        (m.phone_number.includes(q) || (m.name ?? '').toLowerCase().includes(q)),
    )
  }, [allChurchMembers, currentPhones, pickerSearch])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: () => addChurchGroupMembers(churchId!, id, Array.from(selected)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-groups', churchId, id, 'members'] })
      qc.invalidateQueries({ queryKey: ['church-groups', churchId] })
      setSelected(new Set())
      setPickerOpen(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (phone: string) => removeChurchGroupMember(churchId!, id, phone),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-groups', churchId, id, 'members'] })
      qc.invalidateQueries({ queryKey: ['church-groups', churchId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteChurchGroup(churchId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-groups', churchId] })
      navigate('/groups')
    },
  })

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!churchId) {
    return (
      <p className="text-sm text-muted-foreground">
        No church selected. Go back to Groups and select a church first.
      </p>
    )
  }
  if (groupsQuery.isLoading) return <Skeleton className="h-8 w-48" />
  if (!group) return <p className="text-sm text-muted-foreground">Group not found.</p>

  const toggleSelect = (phone: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(phone) ? next.delete(phone) : next.add(phone)
      return next
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${group.icon ? group.icon + ' ' : ''}${group.name}`}
        description={`${group.code} • ${group.member_count} member${group.member_count !== 1 ? 's' : ''}`}
        action={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`Delete group "${group.name}"? This cannot be undone.`))
                deleteMutation.mutate()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>

        {/* ── Members tab ─────────────────────────────────────────────────── */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Member picker dialog */}
            <Dialog open={pickerOpen} onOpenChange={(v) => { setPickerOpen(v); if (!v) { setSelected(new Set()); setPickerSearch('') } }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Add Members
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Members to {group.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Search by name or phone…"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                  />
                  <div className="max-h-72 overflow-y-auto rounded-md border">
                    {churchMembersQuery.isLoading ? (
                      <p className="p-4 text-sm text-muted-foreground">Loading church members…</p>
                    ) : availableMembers.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        {pickerSearch ? 'No matches.' : 'All church members are already in this group.'}
                      </p>
                    ) : (
                      availableMembers.map((m) => (
                        <button
                          key={m.phone_number}
                          type="button"
                          onClick={() => toggleSelect(m.phone_number)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                            selected.has(m.phone_number) ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          <span
                            className={`h-4 w-4 shrink-0 rounded border ${
                              selected.has(m.phone_number)
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}
                          />
                          <span className="flex-1">
                            {m.name && <span className="font-medium">{m.name} </span>}
                            <span className="font-mono text-muted-foreground">{m.phone_number}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selected.size > 0 ? `${selected.size} selected` : ''}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPickerOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={selected.size === 0 || addMutation.isPending}
                        onClick={() => addMutation.mutate()}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {addMutation.isPending ? 'Adding…' : `Add ${selected.size || ''}`}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <BulkImportDialog churchId={churchId} groupId={id} />
          </div>

          {membersQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No members yet. Use "Add Members" to assign church members to this group.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMembers.map((m) => (
                    <TableRow key={m.phone_number}>
                      <TableCell className="font-mono text-sm">{m.phone_number}</TableCell>
                      <TableCell>{m.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.added_at ? new Date(m.added_at).toLocaleDateString() : '—'}
                      </TableCell>
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
          )}
        </TabsContent>

        {/* ── Edit tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="edit" className="mt-4 max-w-lg">
          <GroupForm
            churchId={churchId}
            group={group}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['church-groups', churchId] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
