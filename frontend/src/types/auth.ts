export type UserRole = 'super_admin' | 'church_admin' | 'admin' // 'admin' is the legacy church_admin role

export interface User {
  id: number
  username: string
  email: string
  phone?: string
  role: UserRole
  is_active: boolean
  report_frequency?: string
  report_recipients?: string | string[]
  report_dispatch_hour?: number
  created_at?: string
}

/** Returns true for church_admin (and legacy 'admin') users */
export function isChurchAdmin(user: User | null): boolean {
  return user?.role === 'church_admin' || user?.role === 'admin'
}

/** Returns true only for system super admins (Tier 1) */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'super_admin'
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expires_at: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface UpdateProfilePayload {
  report_frequency?: string
  report_recipients?: string | string[]
  report_dispatch_hour?: number
  phone?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}
