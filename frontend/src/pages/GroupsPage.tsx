import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertCircle } from 'lucide-react'
import { listChurchGroups } from '@/api/church-groups'
import { useChurchStore } from '@/stores/churchStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupForm } from '@/components/groups/GroupForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function GroupsPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const churchId = useChurchStore((s) => s.activeChurchId)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['church-groups', churchId],
    queryFn: () => listChurchGroups(churchId!),
    enabled: !!churchId,
  })

  if (!churchId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Groups" description="Organise members into ministry groups" />
        <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Select a church first from the <strong>Churches</strong> page before managing groups.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Organise members into ministry groups. A member can belong to multiple groups."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
              </DialogHeader>
              <GroupForm
                churchId={churchId}
                onSuccess={() => {
                  setOpen(false)
                  qc.invalidateQueries({ queryKey: ['church-groups', churchId] })
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : groups?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No groups yet. Create your first one above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups?.map((g) => <GroupCard key={g.id} group={g} churchId={churchId} />)}
        </div>
      )}
    </div>
  )
}
