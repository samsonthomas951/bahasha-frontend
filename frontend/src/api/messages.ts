import { apiClient } from '@/lib/axios'
import type { Conversation, ConversationsQuery, Message, MessageStats, SendMessagePayload } from '@/types/message'
import type { PaginatedResponse } from '@/types/api'

export const getConversations = (params?: ConversationsQuery) =>
  apiClient
    .get<{ conversations: Conversation[]; total: number; pages: number; current_page: number }>(
      '/messages/conversations',
      { params },
    )
    .then((r): PaginatedResponse<Conversation> => ({
      items: r.data.conversations,
      total: r.data.total,
      pages: r.data.pages,
      page: r.data.current_page,
      per_page: (params as { per_page?: number })?.per_page ?? 20,
    }))

export const getConversationMessages = (conversationId: string, page = 1) =>
  apiClient
    .get<{ messages: Message[]; total: number; pages: number; current_page: number }>(
      `/messages/conversations/${conversationId}/messages`,
      { params: { page, per_page: 50 } },
    )
    .then((r): PaginatedResponse<Message> => ({
      items: r.data.messages,
      total: r.data.total,
      pages: r.data.pages,
      page: r.data.current_page,
      per_page: 50,
    }))

export const sendMessage = (body: SendMessagePayload) =>
  apiClient.post<Message>('/messages/send', body).then((r) => r.data)

export const getMessageStats = () =>
  apiClient.get<MessageStats>('/messages/stats').then((r) => r.data)

export const archiveConversation = (conversationId: string, archived: boolean) =>
  apiClient
    .put(`/messages/conversations/${conversationId}/archive`, { archive: archived })
    .then((r) => r.data)

export const starConversation = (conversationId: string, starred: boolean) =>
  apiClient
    .put(`/messages/conversations/${conversationId}/star`, { star: starred })
    .then((r) => r.data)
