import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CampaignStatusBadge } from './CampaignStatusBadge'
import { sendCampaign } from '@/api/campaigns'
import type { Campaign } from '@/types/campaign'

interface Props {
  campaign: Campaign
}

export function CampaignCard({ campaign }: Props) {
  const qc = useQueryClient()
  const sendMutation = useMutation({
    mutationFn: () => sendCampaign(campaign.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/campaigns/${campaign.id}`} className="hover:underline">
            <CardTitle className="text-base">{campaign.name}</CardTitle>
          </Link>
          <CampaignStatusBadge status={campaign.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Recipients</dt>
            <dd className="font-medium">{campaign.total_recipients}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sent</dt>
            <dd className="font-medium">{campaign.messages_sent}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Delivered</dt>
            <dd className="font-medium">{campaign.messages_delivered}</dd>
          </div>
        </dl>
        {campaign.status === 'draft' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sendMutation.isPending ? 'Sending…' : 'Send Now'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
