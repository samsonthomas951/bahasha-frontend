import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Conversation } from '@/types/message'

interface Props {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const displayName =
    conversation.contact_name ??
    conversation.contact_profile_name ??
    conversation.phone_number

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50',
        isActive && 'bg-muted',
      )}
      onClick={onClick}
    >
      <Avatar className="mt-0.5 h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatRelativeTime(conversation.last_message_time)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs text-muted-foreground">
            {conversation.last_message_content ?? 'No messages'}
          </p>
          {conversation.unread_count > 0 && (
            <Badge className="h-4 min-w-4 shrink-0 px-1 text-[10px]">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}
