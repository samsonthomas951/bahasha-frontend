import { apiClient } from '@/lib/axios'
import type {
  ChurchGroup,
  ChurchGroupMember,
  CreateChurchGroupPayload,
  UpdateChurchGroupPayload,
} from '@/types/church-group'
import type { ApiSuccess } from '@/types/api'

export const listChurchGroups = (churchId: number) =>
  apiClient
    .get<{ groups: ChurchGroup[] }>(`/churches/${churchId}/groups`)
    .then((r) => r.data.groups)

export const createChurchGroup = (churchId: number, body: CreateChurchGroupPayload) =>
  apiClient
    .post<{ group: ChurchGroup }>(`/churches/${churchId}/groups`, body)
    .then((r) => r.data.group)

export const updateChurchGroup = (
  churchId: number,
  groupId: number,
  body: UpdateChurchGroupPayload,
) =>
  apiClient
    .put<{ group: ChurchGroup }>(`/churches/${churchId}/groups/${groupId}`, body)
    .then((r) => r.data.group)

export const deleteChurchGroup = (churchId: number, groupId: number) =>
  apiClient
    .delete<ApiSuccess>(`/churches/${churchId}/groups/${groupId}`)
    .then((r) => r.data)

export const getChurchGroupMembers = (churchId: number, groupId: number) =>
  apiClient
    .get<{ members: ChurchGroupMember[]; group: ChurchGroup }>(
      `/churches/${churchId}/groups/${groupId}/members`,
    )
    .then((r) => r.data)

export const addChurchGroupMembers = (churchId: number, groupId: number, phones: string[]) =>
  apiClient
    .post<{ added: number; skipped: number; group: ChurchGroup }>(
      `/churches/${churchId}/groups/${groupId}/members`,
      { phones },
    )
    .then((r) => r.data)

export const removeChurchGroupMember = (churchId: number, groupId: number, phone: string) =>
  apiClient
    .delete<ApiSuccess>(
      `/churches/${churchId}/groups/${groupId}/members/${encodeURIComponent(phone)}`,
    )
    .then((r) => r.data)

export const bulkAddChurchGroupMembers = (churchId: number, groupId: number, phones: string[]) =>
  apiClient
    .post<{ added: number; already_in_group: number; not_church_member: number; group: ChurchGroup }>(
      `/churches/${churchId}/groups/${groupId}/members/bulk`,
      { phones },
    )
    .then((r) => r.data)
