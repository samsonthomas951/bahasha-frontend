export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'template'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: number
  whatsapp_message_id?: string
  direction: MessageDirection
  phone_number: string
  system_phone?: string
  sender_name?: string
  message_type: MessageType
  content?: string
  media_url?: string
  media_mime_type?: string
  media_id?: string
  template_name?: string
  location_latitude?: number
  location_longitude?: number
  location_name?: string
  status: MessageStatus
  sent_at?: string
  delivered_at?: string
  read_at?: string
  failed_at?: string
  failure_reason?: string
  reply_to_message_id?: string
  conversation_id?: string
  campaign_id?: number
  created_at?: string
}

export interface Conversation {
  id: number
  conversation_id: string
  phone_number: string
  contact_name?: string
  contact_profile_name?: string
  last_message_content?: string
  last_message_time?: string
  last_message_direction?: MessageDirection
  unread_count: number
  total_messages: number
  is_active: boolean
  is_archived: boolean
  is_starred: boolean
  created_at?: string
  updated_at?: string
}

export interface MessageStats {
  total: number
  sent: number
  received: number
  delivered: number
  read: number
  failed: number
}

export interface SendMessagePayload {
  phone_number: string
  message_type: 'text' | 'image' | 'document'
  content?: string
  media_url?: string
}

export interface ConversationsQuery {
  page?: number
  per_page?: number
  search?: string
  archived?: boolean
  starred?: boolean
}
