import { apiClient } from '@/lib/axios'
import type { User } from '@/types/auth'

export interface SystemStats {
  total_users: number
  total_churches: number
  total_messages: number
  total_campaigns: number
  total_donations: number
}

export interface AdminUser extends User {
  church_count: number
  created_at?: string
  last_login?: string
}

export interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  per_page: number
  pages: number
}

export const getSystemStats = () =>
  apiClient.get<SystemStats>('/admin/stats').then((r) => r.data)

export const listAllUsers = (page = 1, per_page = 20) =>
  apiClient
    .get<UsersResponse>('/admin/users', { params: { page, per_page } })
    .then((r) => r.data)

export const deactivateUser = (userId: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`).then((r) => r.data)

export const activateUser = (userId: number) =>
  apiClient.post<{ success: boolean; message: string }>(`/admin/users/${userId}/activate`).then((r) => r.data)

// ─── WhatsApp Templates ────────────────────────────────────────────────────

export interface WaTemplate {
  id: string
  name: string
  language: string
  category: string
  status: string
  rejected_reason?: string | null
}

export interface ButtonDef {
  type: 'quick_reply' | 'url' | 'phone'
  text: string
  url?: string
  url_example?: string
  phone_number?: string
}

export interface AuthConfig {
  add_security_recommendation?: boolean
  code_expiration_minutes?: number | null
  otp_button_text?: string
}

export interface CreateTemplatePayload {
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  header?: {
    type: 'none' | 'text' | 'image' | 'video' | 'document'
    text?: string
    example_url?: string
    examples?: Record<string, string>
  }
  body: {
    text: string
    examples?: Record<string, string>
  }
  footer?: string
  buttons?: ButtonDef[]
  auth_config?: AuthConfig
}

export const listAdminTemplates = () =>
  apiClient.get<{ templates: WaTemplate[] }>('/admin/templates').then((r) => r.data.templates)

export const createWaTemplate = (payload: CreateTemplatePayload) =>
  apiClient.post<{ success: boolean; template_id: string; status: string }>('/admin/templates', payload).then((r) => r.data)

export const deleteWaTemplate = (templateName: string) =>
  apiClient.delete<{ success: boolean }>(`/admin/templates/${templateName}`).then((r) => r.data)
