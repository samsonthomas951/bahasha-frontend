export interface ChurchGroup {
  id: number
  church_id: number
  name: string
  code: string
  description?: string
  color?: string
  icon?: string
  is_active: boolean
  member_count: number
  created_at?: string
  updated_at?: string
}

export interface ChurchGroupMember {
  phone_number: string
  name?: string
  added_at?: string
}

export interface CreateChurchGroupPayload {
  code: string
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateChurchGroupPayload extends Partial<CreateChurchGroupPayload> {}
