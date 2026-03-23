import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getConversationMessages } from '@/api/messages'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'
import type { Conversation } from '@/types/message'

interface Props {
  conversation: Conversation
}

export function MessageThread({ conversation }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['messages', 'conversation', conversation.conversation_id, { page: 1 }],
    queryFn: () => getConversationMessages(conversation.conversation_id),
  })

  // Scroll to bottom when messages load or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.items.length])

  const displayName =
    conversation.contact_name ??
    conversation.contact_profile_name ??
    conversation.phone_number

  // Messages come newest-first from API — reverse for display
  const messages = data ? [...data.items].reverse() : []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {getInitials(displayName)}
        </div>
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{conversation.phone_number}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-10 w-56 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet</p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput
        phoneNumber={conversation.phone_number}
        conversationId={conversation.conversation_id}
      />
    </div>
  )
}
