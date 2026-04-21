import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Link2, Copy, Check, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CampaignStatusBadge } from './CampaignStatusBadge'
import { sendCampaign, deleteCampaign } from '@/api/campaigns'
import type { Campaign } from '@/types/campaign'

interface Props {
  campaign: Campaign
  churchCode?: string
}

export function CampaignCard({ campaign, churchCode }: Props) {
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)

  const sendMutation = useMutation({
    mutationFn: () => sendCampaign(campaign.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCampaign(campaign.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const donationUrl = churchCode
    ? `${window.location.origin}/form/${churchCode}/${campaign.id}`
    : null

  function copyUrl() {
    if (!donationUrl) return
    navigator.clipboard.writeText(donationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

        {donationUrl && (
          <div className="flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3 shrink-0 text-primary" />
            <a
              href={donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate font-mono text-[11px] text-primary hover:underline"
            >
              {donationUrl.replace(/^https?:\/\//, '')}
            </a>
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 rounded p-0.5 hover:bg-muted"
              title="Copy donation URL"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
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

          {campaign.status !== 'active' && campaign.status !== 'sending' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete <strong>{campaign.name}</strong> and all its recipient data. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
