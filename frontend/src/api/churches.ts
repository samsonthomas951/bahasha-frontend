import { apiClient } from '@/lib/axios'
import type {
  Church,
  ChurchAdminMember,
  ChurchAdminPermissions,
  ChurchMember,
  ChurchMpesaCredential,
  ChurchSheet,
  ChurchStats,
  CreateChurchPayload,
  MemberInvite,
  SheetsStatus,
  SubmitMpesaCredentialsPayload,
  UpdateChurchPayload,
  AdminSlots,
} from '@/types/church'
import type { ApiSuccess } from '@/types/api'

export const getChurches = () =>
  apiClient.get<{ churches: Church[] }>('/churches/').then((r) => r.data.churches)

export const getChurch = (id: number) =>
  apiClient.get<{ church: Church }>(`/churches/${id}`).then((r) => r.data.church)

export const getChurchByCode = (code: string) =>
  apiClient.get<{ church: Church }>(`/churches/code/${code}`).then((r) => r.data.church)

export const createChurch = (body: CreateChurchPayload) =>
  apiClient.post<{ church: Church }>('/churches/', body).then((r) => r.data.church)

export const updateChurch = (id: number, body: UpdateChurchPayload) =>
  apiClient.put<{ church: Church }>(`/churches/${id}`, body).then((r) => r.data.church)

export const deleteChurch = (id: number) =>
  apiClient.delete<ApiSuccess>(`/churches/${id}`).then((r) => r.data)

export const getChurchStats = (id: number) =>
  apiClient.get<ChurchStats>(`/churches/${id}/stats`).then((r) => r.data)

export const getSheetsStatus = (id: number) =>
  apiClient.get<SheetsStatus>(`/churches/${id}/sheets/status`).then((r) => r.data)

export const initializeSheets = (id: number) =>
  apiClient.post<{ task_id: string }>(`/churches/${id}/initialize-sheets`).then((r) => r.data)

export const createWeeklySheet = (id: number) =>
  apiClient.post<{ task_id: string }>(`/churches/${id}/create-weekly-sheet`).then((r) => r.data)

export const createMonthlySheet = (id: number) =>
  apiClient.post<{ task_id: string }>(`/churches/${id}/create-monthly-sheet`).then((r) => r.data)

export const shareSheets = (id: number, emails: string[]) =>
  apiClient.post<ApiSuccess>(`/churches/${id}/share-sheets`, { emails }).then((r) => r.data)

export const getChurchSheets = (id: number) =>
  apiClient
    .get<{ sheets: ChurchSheet[] }>(`/churches/${id}/sheets`)
    .then((r) => r.data.sheets)

export const addAdmin = (id: number, email: string) =>
  apiClient.post<ApiSuccess>(`/churches/${id}/add-admin`, { email }).then((r) => r.data)

export const removeAdmin = (id: number, email: string) =>
  apiClient.post<ApiSuccess>(`/churches/${id}/remove-admin`, { email }).then((r) => r.data)

export const getChurchMembers = (id: number, page = 1, perPage = 50) =>
  apiClient
    .get<{ members: ChurchMember[]; total: number; page: number; per_page: number; pages: number }>(
      `/churches/${id}/members`,
      { params: { page, per_page: perPage } },
    )
    .then((r) => r.data)

export const addChurchMember = (id: number, phone_number: string, name?: string) =>
  apiClient.post<ApiSuccess>(`/churches/${id}/members`, { phone_number, name }).then((r) => r.data)

export const removeChurchMember = (id: number, phone_number: string) =>
  apiClient.delete<ApiSuccess>(`/churches/${id}/members/${phone_number}`).then((r) => r.data)

export const searchChurches = (q: string) =>
  apiClient
    .get<{ churches: Church[] }>('/churches/search', { params: { q } })
    .then((r) => r.data.churches)

export const getChurchAdmins = (id: number) =>
  apiClient
    .get<{ church_id: number; admins: ChurchAdminMember[]; slots: AdminSlots }>(`/churches/${id}/admins`)
    .then((r) => r.data)

export const addChurchAdmin = (
  id: number,
  email: string,
  permissions: Partial<ChurchAdminPermissions>,
  notify = false,
) =>
  apiClient
    .post<{ message: string; admin: ChurchAdminMember }>(`/churches/${id}/admins`, { email, permissions, notify })
    .then((r) => r.data)

export const updateChurchAdmin = (id: number, userId: number, permissions: Partial<ChurchAdminPermissions>) =>
  apiClient
    .put<{ message: string; admin: ChurchAdminMember }>(`/churches/${id}/admins/${userId}`, { permissions })
    .then((r) => r.data)

export const removeChurchAdmin = (id: number, userId: number) =>
  apiClient.delete<ApiSuccess>(`/churches/${id}/admins/${userId}`).then((r) => r.data)

export const getChurchInvites = (id: number) =>
  apiClient
    .get<{ church_id: number; invites: MemberInvite[] }>(`/churches/${id}/invites`)
    .then((r) => r.data.invites)

export const createMemberInvite = (
  id: number,
  payload: { phone_number: string; name?: string; email: string },
) =>
  apiClient
    .post<{ message: string; invite: MemberInvite }>(`/churches/${id}/members/invite`, payload)
    .then((r) => r.data)

export const cancelMemberInvite = (id: number, inviteId: number) =>
  apiClient.delete<ApiSuccess>(`/churches/${id}/invites/${inviteId}`).then((r) => r.data)

export const getMpesaCredentials = (id: number) =>
  apiClient
    .get<ChurchMpesaCredential>(`/churches/${id}/mpesa-credentials`)
    .then((r) => r.data)

export const submitMpesaCredentials = (id: number, payload: SubmitMpesaCredentialsPayload) =>
  apiClient
    .post<{ message: string; shortcode: string; environment: string; warning?: string }>(
      `/churches/${id}/mpesa-credentials`,
      payload,
    )
    .then((r) => r.data)

export const bulkAddChurchMembers = (
  id: number,
  members: { phone_number: string; name?: string }[],
) =>
  apiClient
    .post<{ message: string; added: number; updated: number; failed: { phone_number: string; error: string }[] }>(
      `/churches/${id}/members/bulk`,
      { members },
    )
    .then((r) => r.data)
