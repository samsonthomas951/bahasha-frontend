import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CampaignReport } from '@/types/campaign'

interface Props {
  report: CampaignReport
}

export function CampaignReportChart({ report }: Props) {
  const { campaign } = report
  const data = [
    { label: 'Recipients', value: campaign.total_recipients, color: '#6366f1' },
    { label: 'Sent', value: campaign.messages_sent, color: '#8b5cf6' },
    { label: 'Delivered', value: campaign.messages_delivered, color: '#06b6d4' },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
