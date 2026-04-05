import { useQuery } from '@tanstack/react-query'
import { getSheetsStatus } from '@/api/churches'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface Props {
  churchId: number
  initialStatus?: string
}

export function SheetsStatusBadge({ churchId, initialStatus }: Props) {
  const { data } = useQuery({
    queryKey: ['churches', churchId, 'sheets-status'],
    queryFn: () => getSheetsStatus(churchId),
    refetchInterval: (query) => {
      const status = query.state.data?.sheets_status
      if (status === 'completed' || status === 'failed') return false
      return 10000
    },
    enabled: initialStatus !== 'completed',
  })

  const status = data?.sheets_status ?? initialStatus ?? 'none'

  if (status === 'none') return null

  if (status === 'pending') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Setting up sheets…
      </Badge>
    )
  }
  if (status === 'completed') {
    return <Badge className="bg-green-600 text-white hover:bg-green-700">Sheets ready</Badge>
  }
  if (status === 'failed') {
    return <Badge variant="destructive">Sheets setup failed</Badge>
  }
  return null
}
