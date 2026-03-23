import { cn, formatDateTime } from '@/lib/utils'
import { MessageStatusIcon } from './MessageStatusIcon'
import type { Message } from '@/types/message'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
          isOutbound
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        {message.message_type === 'image' && message.media_url && (
          <img src={message.media_url} alt="media" className="mb-1 max-w-xs rounded" />
        )}
        {message.message_type === 'document' && message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            📄 Document
          </a>
        )}
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-[10px]',
            isOutbound ? 'justify-end text-primary-foreground/70' : 'justify-end text-muted-foreground',
          )}
        >
          <span>{formatDateTime(message.sent_at ?? message.created_at)}</span>
          {isOutbound && <MessageStatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}
