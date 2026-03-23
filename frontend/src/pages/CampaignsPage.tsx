import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { listCampaigns } from '@/api/campaigns'
import { PageHeader } from '@/components/layout/PageHeader'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { page: 1, per_page: 20 }],
    queryFn: () => listCampaigns({ page: 1, per_page: 20 }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Manage WhatsApp campaigns"
        action={
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((c) => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      )}
    </div>
  )
}
