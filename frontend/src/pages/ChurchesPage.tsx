import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getChurches } from '@/api/churches'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChurchCard } from '@/components/churches/ChurchCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChurchesPage() {
  const { data: churches, isLoading } = useQuery({
    queryKey: ['churches'],
    queryFn: getChurches,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Churches"
        description="Manage your churches"
        action={
          <Button asChild>
            <Link to="/churches/new">
              <Plus className="mr-2 h-4 w-4" />
              New Church
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : churches?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No churches yet. Create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {churches?.map((c) => <ChurchCard key={c.id} church={c} />)}
        </div>
      )}
    </div>
  )
}
