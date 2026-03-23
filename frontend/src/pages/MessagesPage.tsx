import { useState } from 'react'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'
import { useConversationRealtime } from '@/hooks/useConversationRealtime'
import type { Conversation } from '@/types/message'

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

  // Subscribe to real-time updates
  useConversationRealtime()

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="w-72 shrink-0">
        <ConversationList
          activeConversationId={activeConversation?.conversation_id ?? null}
          onSelect={setActiveConversation}
        />
      </div>
      <div className="flex-1">
        {activeConversation ? (
          <MessageThread conversation={activeConversation} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
