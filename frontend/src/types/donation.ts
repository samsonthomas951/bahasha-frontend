export type DonationStatus = 'pending' | 'completed' | 'failed'

export interface Donation {
  id: number
  checkout_request_id: string
  merchant_request_id?: string
  phone_number: string
  amount: number
  donor_name?: string
  member_status?: 'member' | 'visitor'
  tithe?: number
  offering?: number
  local_budget?: number
  church_development?: number
  evangelism?: number
  dynamic_categories?: Record<string, number>
  status: DonationStatus
  mpesa_receipt_number?: string
  transaction_date?: string
  result_code?: string
  result_desc?: string
  church_id: number
  created_at?: string
}

export interface DonationStats {
  total_donations: number
  total_amount: number
  average_amount: number
  completed_donations: number
  pending_donations: number
  failed_donations: number
  by_category: {
    tithe: number
    offering: number
    local_budget: number
    church_development: number
    evangelism: number
  }
  recent_donations: Donation[]
}
