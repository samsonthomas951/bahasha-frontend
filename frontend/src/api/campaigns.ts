import { apiClient } from '@/lib/axios'
import type {
  Campaign,
  CampaignRecipient,
  CampaignReport,
  CampaignAnalytics,
  CreateCampaignPayload,
  WhatsAppTemplate,
} from '@/types/campaign'
import type { PaginatedResponse } from '@/types/api'
import type { Group } from '@/types/group'

export interface CampaignListParams {
  page?: number
  per_page?: number
  status?: string
}

export const listCampaigns = (params?: CampaignListParams) =>
  apiClient
    .get<{ campaigns: Campaign[]; total: number; pages: number; current_page: number }>('/campaigns/list', { params })
    .then((r): PaginatedResponse<Campaign> => ({
      items: r.data.campaigns,
      total: r.data.total,
      pages: r.data.pages,
      page: r.data.current_page,
      per_page: params?.per_page ?? 20,
    }))

export const createCampaign = (body: CreateCampaignPayload) =>
  apiClient
    .post<{ success: boolean; campaign: Campaign }>('/campaigns/create', body)
    .then((r) => r.data.campaign)

export const sendCampaign = (campaignId: number) =>
  apiClient.post<Campaign>(`/campaigns/${campaignId}/send`).then((r) => r.data)

interface ReportApiResponse {
  success: boolean
  report: {
    campaign: Campaign
    recipients: CampaignRecipient[]
    summary: CampaignReport['summary']
    revenue: CampaignReport['revenue']
  }
}

export const getCampaignReport = (campaignId: number) =>
  apiClient
    .get<ReportApiResponse>(`/campaigns/${campaignId}/report`)
    .then((r) => {
      const { campaign, recipients, summary, revenue } = r.data.report
      return {
        campaign,
        recipients,
        summary,
        revenue,
        // convenience aliases
        delivery_rate: summary.delivery_rate,
        response_rate: summary.response_rate,
      } satisfies CampaignReport
    })

export const getCampaignAnalytics = () =>
  apiClient
    .get<{ success: boolean } & CampaignAnalytics>('/campaigns/analytics')
    .then((r) => ({ campaigns: r.data.campaigns, summary: r.data.summary }) satisfies CampaignAnalytics)

export const getTemplates = () =>
  apiClient
    .get<{ success: boolean; templates: WhatsAppTemplate[] }>('/campaigns/templates')
    .then((r) => r.data.templates)

export const getCampaignGroups = () =>
  apiClient.get<Group[]>('/campaigns/groups').then((r) => r.data)
