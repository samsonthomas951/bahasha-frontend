export interface Group {
  id: number
  code: string
  name: string
  description?: string
  is_active: boolean
  color?: string
  icon?: string
  member_count: number
  created_at?: string
}

export interface Member {
  id: number
  phone_number: string
  name?: string
  email?: string
  group_id?: number
  group_code?: string
  member_type?: string
  is_active: boolean
  notes?: string
  total_donations: number
  donation_count: number
  last_donation_date?: string
  joined_date?: string
}

export interface GroupStats {
  statistics: Array<{
    group: Group
    member_count: number
    donation_count: number
    total_amount: number
  }>
  summary: {
    total_groups: number
    total_members: number
    total_donations: number
  }
}

export interface CreateGroupPayload {
  code: string
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateGroupPayload extends Partial<CreateGroupPayload> {}
