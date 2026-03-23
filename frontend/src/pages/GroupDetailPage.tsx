import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import { getGroupMembers, removeGroupMember, addGroupMember, deleteGroup } from '@/api/groups'
import { PageHeader } from '@/components/layout/PageHeader'
import { BulkImportDialog } from '@/components/groups/BulkImportDialog'
import { GroupForm } from '@/components/groups/GroupForm'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { listGroups } from '@/api/groups'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const id = Number(groupId)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: listGroups })
  const group = groupsQuery.data?.find((g) => g.id === id)

  const membersQuery = useQuery({
    queryKey: ['groups', id, 'members'],
    queryFn: () => getGroupMembers(id),
  })

  const addMutation = useMutation({
    mutationFn: () => addGroupMember(id, phone, name || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', id, 'members'] })
      setPhone('')
      setName('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (phoneNumber: string) => removeGroupMember(id, phoneNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', id, 'members'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      navigate('/groups')
    },
  })

  if (groupsQuery.isLoading) return <Skeleton className="h-8 w-48" />
  if (!group) return <p className="text-sm text-muted-foreground">Group not found</p>

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description={`${group.code} • ${group.member_count} members`}
        action={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => { if (confirm(`Delete ${group.name}?`)) deleteMutation.mutate() }}
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

        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="+254700000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-44"
            />
            <Input
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-40"
            />
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!phone || addMutation.isPending}>
              <Plus className="mr-1 h-4 w-4" />Add
            </Button>
            <BulkImportDialog groupId={id} />
          </div>

          {membersQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Donations</TableHead>
                  <TableHead>Last Donation</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersQuery.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No members</TableCell>
                  </TableRow>
                ) : (
                  membersQuery.data?.map((m) => (
                    <TableRow key={m.phone_number}>
                      <TableCell className="font-mono text-sm">{m.phone_number}</TableCell>
                      <TableCell>{m.name ?? '—'}</TableCell>
                      <TableCell>{formatCurrency(m.total_donations)}</TableCell>
                      <TableCell>{formatDate(m.last_donation_date)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeMutation.mutate(m.phone_number)}
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

        <TabsContent value="edit" className="mt-4 max-w-lg">
          <GroupForm group={group} onSuccess={() => qc.invalidateQueries({ queryKey: ['groups'] })} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
