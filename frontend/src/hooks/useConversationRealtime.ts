import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCentrifuge } from './useCentrifuge'
import type { Conversation, Message } from '@/types/message'
import type { PaginatedResponse } from '@/types/api'

interface RealtimeEvent {
  event: 'new_message' | 'update_conversation' | 'message_status_update'
  payload: Record<string, unknown>
}

export function useConversationRealtime() {
  const { centrifuge } = useCentrifuge()
  const qc = useQueryClient()

  useEffect(() => {
    if (!centrifuge) return

    const sub = centrifuge.newSubscription('messages')

    sub.on('publication', ({ data }: { data: RealtimeEvent }) => {
      const { event, payload } = data

      if (event === 'new_message') {
        const msg = payload as unknown as Message
        // Prepend to conversation message cache
        if (msg.conversation_id) {
          qc.setQueryData<PaginatedResponse<Message>>(
            ['messages', 'conversation', msg.conversation_id, { page: 1 }],
            (old) => {
              if (!old) return old
              return { ...old, items: [msg, ...old.items], total: old.total + 1 }
            },
          )
        }
        // Update unread count in conversation list
        qc.setQueryData<PaginatedResponse<Conversation>>(
          ['messages', 'conversations', {}],
          (old) => {
            if (!old) return old
            return {
              ...old,
              items: old.items.map((c) =>
                c.conversation_id === msg.conversation_id
                  ? {
                      ...c,
                      last_message_content: String(msg.content ?? ''),
                      last_message_time: msg.created_at,
                      last_message_direction: msg.direction,
                      unread_count: c.unread_count + (msg.direction === 'inbound' ? 1 : 0),
                    }
                  : c,
              ),
            }
          },
        )
      }

      if (event === 'update_conversation') {
        const updated = payload as unknown as Partial<Conversation> & { conversation_id: string }
        qc.setQueryData<PaginatedResponse<Conversation>>(
          ['messages', 'conversations', {}],
          (old) => {
            if (!old) return old
            return {
              ...old,
              items: old.items.map((c) =>
                c.conversation_id === updated.conversation_id ? { ...c, ...updated } : c,
              ),
            }
          },
        )
      }

      if (event === 'message_status_update') {
        const { message_id, status, conversation_id } = payload as {
          message_id: string
          status: string
          conversation_id: string
        }
        qc.setQueryData<PaginatedResponse<Message>>(
          ['messages', 'conversation', conversation_id, { page: 1 }],
          (old) => {
            if (!old) return old
            return {
              ...old,
              items: old.items.map((m) =>
                m.whatsapp_message_id === message_id ? { ...m, status: status as Message['status'] } : m,
              ),
            }
          },
        )
      }
    })

    sub.subscribe()

    return () => {
      sub.unsubscribe()
    }
  }, [centrifuge, qc])
}
