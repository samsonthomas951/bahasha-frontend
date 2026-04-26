import { apiClient } from '@/lib/axios'
import type { DonationStats } from '@/types/donation'

export const getDonationStats = (churchId: number) =>
  apiClient.get<DonationStats>(`/churches/${churchId}/stats`).then((r) => r.data)

export interface ManualDonationEntry {
  donor_name: string
  phone_number?: string
  member_status: 'member' | 'visitor'
  tithe?: number
  offering?: number
  local_budget?: number
  church_development?: number
  evangelism?: number
  dynamic_categories?: Record<string, number>
  transaction_date?: string
}

export const submitManualDonations = (churchId: number, entries: ManualDonationEntry[]) =>
  apiClient
    .post<{ message: string; created: number }>(`/churches/${churchId}/donations/manual`, { entries })
    .then((r) => r.data)
