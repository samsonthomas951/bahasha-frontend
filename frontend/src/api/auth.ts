import { apiClient } from '@/lib/axios'
import type { ChangePasswordPayload, LoginPayload, LoginResponse, RegisterPayload, UpdateProfilePayload, User } from '@/types/auth'

export const login = (body: LoginPayload) =>
  apiClient.post<LoginResponse>('/auth/login', body).then((r) => r.data)

export const register = (body: RegisterPayload) =>
  apiClient.post<{ message: string }>('/auth/register', body).then((r) => r.data)

export const logout = () =>
  apiClient.post('/auth/logout').then((r) => r.data)

export const verifyToken = (token?: string) =>
  apiClient
    .get<{ valid: boolean; user: User }>('/auth/verify', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    .then((r) => r.data)

export const getProfile = () =>
  apiClient.get<User>('/auth/profile').then((r) => r.data)

export const updateProfile = (body: UpdateProfilePayload) =>
  apiClient.put<User>('/auth/profile', body).then((r) => r.data)

export const changePassword = (body: ChangePasswordPayload) =>
  apiClient.post<{ success: boolean; message: string }>('/auth/profile/password', body).then((r) => r.data)

export const getCentrifugoToken = () =>
  apiClient.get<{ token: string }>('/centrifugo/token').then((r) => r.data)

export const forgotPassword = (email: string) =>
  apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token: string, new_password: string) =>
  apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { token, new_password }).then((r) => r.data)
