import { apiClient } from '@/lib/axios'
import type { DonationStats } from '@/types/donation'

export const getDonationStats = (churchId: number) =>
  apiClient.get<DonationStats>(`/churches/${churchId}/stats`).then((r) => r.data)
