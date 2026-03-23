import { Check, CheckCheck, Clock, X } from 'lucide-react'
import type { MessageStatus } from '@/types/message'

interface Props {
  status: MessageStatus
}

export function MessageStatusIcon({ status }: Props) {
  if (status === 'pending') return <Clock className="h-3 w-3 text-muted-foreground" />
  if (status === 'sent') return <Check className="h-3 w-3 text-muted-foreground" />
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-muted-foreground" />
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-500" />
  if (status === 'failed') return <X className="h-3 w-3 text-destructive" />
  return null
}
