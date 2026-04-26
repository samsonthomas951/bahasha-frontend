export interface Church {
  id: number
  name: string
  code: string
  description?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  template_name?: string
  template_language?: string
  template_header_image?: string
  primary_color?: string
  logo_url?: string
  mpesa_shortcode?: string
  mpesa_account_reference?: string
  drive_folder_id?: string
  master_spreadsheet_id?: string
  sheets_initialized: boolean
  sheets_status?: 'none' | 'pending' | 'completed' | 'failed'
  sheets_error?: string
  admin_emails?: string[]
  is_active: boolean
  is_featured: boolean
  created_at?: string
}

export interface ChurchSheet {
  id: number
  church_id: number
  spreadsheet_id: string
  sheet_type: 'weekly' | 'monthly' | 'master'
  sheet_name: string
  period_start?: string
  period_end?: string
  year?: number
  week_number?: number
  month?: number
  is_current: boolean
  web_view_link?: string
}

export interface SheetsStatus {
  sheets_status: 'none' | 'pending' | 'completed' | 'failed'
  sheets_error?: string
  sheets_initialized: boolean
  task_id?: string
}

export interface ChurchStats {
  church_id: number
  church_name: string
  user_count: number
  donation_count: number
  total_amount: number
  average_donation: number
  sheets_initialized: boolean
  sheets_status: string
}

export interface ChurchMember {
  phone_number: string
  name?: string
  member_status?: string
  church_id: number
  assigned_at?: string
}

export interface CreateChurchPayload {
  name: string
  code: string
  description?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  logo_url?: string
  primary_color?: string
  admin_emails?: string[]
  setup_sheets?: boolean
}

export interface UpdateChurchPayload extends Partial<CreateChurchPayload> {}

export interface ChurchAdminPermissions {
  can_manage_members: boolean
  can_edit_church: boolean
  can_send_campaigns: boolean
  can_view_analytics: boolean
  can_manage_admins: boolean
  can_record_manual_donations: boolean
}

export interface ChurchAdminMember extends ChurchAdminPermissions {
  id: number | null
  church_id: number
  user_id: number
  user: { id: number; email: string; username: string } | null
  invited_by_user_id: number | null
  is_owner: boolean
  joined_at: string | null
  created_at?: string | null
}

export interface MemberInvite {
  id: number
  church_id: number
  phone_number: string
  name: string | null
  email: string
  status: 'pending' | 'accepted' | 'expired'
  invited_by_user_id: number
  expires_at: string
  created_at: string
}

export interface AdminSlots {
  total: number
  used: number
}

export interface ChurchMpesaCredential {
  configured: boolean
  id?: number
  church_id?: number
  shortcode?: string
  environment?: 'sandbox' | 'production'
  is_valid?: boolean
  validated_at?: string
  created_at?: string
}

export interface SubmitMpesaCredentialsPayload {
  consumer_key: string
  consumer_secret: string
  passkey: string
  shortcode: string
  environment: 'sandbox' | 'production'
}
