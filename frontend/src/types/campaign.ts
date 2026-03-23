export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'failed'
export type TargetAudience = 'all' | 'members' | 'visitors' | 'custom'

export interface Campaign {
  id: number
  name: string
  description?: string
  campaign_type?: string
  target_audience: TargetAudience
  message_template?: string
  scheduled_time?: string
  recurring?: boolean
  status: CampaignStatus
  total_recipients: number
  messages_sent: number
  messages_delivered: number
  messages_responses: number
  send_report?: boolean
  report_frequency?: string
  report_day?: string
  creator_id?: number
  created_at?: string
}

export interface CampaignRecipient {
  id: number
  campaign_id: number
  phone_number: string
  name?: string
  member_status?: string
  message_sent: boolean
  delivered: boolean
  responded: boolean
  response_text?: string
}

export interface CampaignReport {
  campaign: Campaign
  recipients: CampaignRecipient[]
  delivery_rate: number
  response_rate: number
}

export interface WhatsAppTemplateHeader {
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text: string | null
}

export interface WhatsAppTemplateComponents {
  header: WhatsAppTemplateHeader | null
  body: string | null
  footer: string | null
  buttons: Array<{ type: string; text: string | null }>
}

export interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  status: string
  category?: string
  components: WhatsAppTemplateComponents
}

export interface TemplateParams {
  church_name?: string
  church_code?: string
  image_url?: string
}

export interface CreateCampaignPayload {
  name: string
  description?: string
  target_audience: TargetAudience
  message_template: string
  scheduled_time?: string
  recurring?: boolean
  send_report?: boolean
  report_frequency?: string
  custom_recipients?: string[]
  template_params?: TemplateParams
}
