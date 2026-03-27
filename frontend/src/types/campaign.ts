export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'sent' | 'sending' | 'completed' | 'failed' | 'cancelled'
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
  messages_read: number
  messages_failed: number
  messages_responses: number
  send_report?: boolean
  report_frequency?: string
  report_day?: string
  creator_id?: number
  created_at?: string
  completed_at?: string
}

export interface CampaignRecipient {
  id: number
  campaign_id: number
  phone_number: string
  name?: string
  member_status?: string
  message_sent: boolean
  delivered: boolean
  read: boolean
  read_at?: string
  failed: boolean
  failed_at?: string
  failure_reason?: string
  responded: boolean
  response_text?: string
}

export interface CampaignDonor {
  phone_number: string
  name: string
  total_amount: number
  donation_count: number
  donations: Array<{ amount: number; date: string; receipt: string }>
}

export interface CampaignRevenue {
  total_amount: number
  donor_count: number
  conversion_rate: number
  donors: CampaignDonor[]
}

export interface CampaignReportSummary {
  total_recipients: number
  messages_sent: number
  messages_delivered: number
  messages_read: number
  messages_failed: number
  responses_received: number
  delivery_rate: number
  read_rate: number
  fail_rate: number
  response_rate: number
}

export interface CampaignReport {
  campaign: Campaign
  recipients: CampaignRecipient[]
  summary: CampaignReportSummary
  revenue: CampaignRevenue
  // convenience aliases kept for backwards compat
  delivery_rate: number
  response_rate: number
}

export interface CampaignAnalyticsRow extends Campaign {
  delivery_rate: number
  read_rate: number
  fail_rate: number
  revenue_total: number
  revenue_donors: number
  conversion_rate: number
}

export interface CampaignAnalytics {
  campaigns: CampaignAnalyticsRow[]
  summary: {
    total_campaigns: number
    total_revenue: number
    best_campaign: string | null
    best_campaign_revenue: number
  }
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
