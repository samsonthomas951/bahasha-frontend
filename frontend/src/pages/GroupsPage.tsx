import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { listGroups } from '@/api/groups'
import { PageHeader } from '@/components/layout/PageHeader'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupForm } from '@/components/groups/GroupForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function GroupsPage() {
  const [open, setOpen] = useState(false)
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: listGroups,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Organize members into groups"
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
              <GroupForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : groups?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No groups yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups?.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      )}
    </div>
  )
}
