import { Badge } from '@/components/ui/badge'
import type { CampaignStatus } from '@/types/campaign'

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-700',
  active: 'bg-yellow-100 text-yellow-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]} variant="outline">
      {status}
    </Badge>
  )
}
