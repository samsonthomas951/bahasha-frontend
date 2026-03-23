import { apiClient } from '@/lib/axios'
import type { CreateGroupPayload, Group, GroupStats, Member, UpdateGroupPayload } from '@/types/group'
import type { ApiSuccess } from '@/types/api'

export const listGroups = () =>
  apiClient.get<{ groups: Group[] }>('/groups/list').then((r) => r.data.groups)

export const createGroup = (body: CreateGroupPayload) =>
  apiClient.post<{ group: Group }>('/groups/create', body).then((r) => r.data.group)

export const updateGroup = (id: number, body: UpdateGroupPayload) =>
  apiClient.put<{ group: Group }>(`/groups/${id}/update`, body).then((r) => r.data.group)

export const deleteGroup = (id: number, force = false) =>
  apiClient.delete<ApiSuccess>(`/groups/${id}/delete`, { params: { force } }).then((r) => r.data)

export const getGroupMembers = (id: number) =>
  apiClient
    .get<{ members: Member[] }>(`/groups/${id}/members`)
    .then((r) => r.data.members)

export const addGroupMember = (id: number, phone_number: string, name?: string) =>
  apiClient.post<ApiSuccess>(`/groups/${id}/add-member`, { phone_number, name }).then((r) => r.data)

export const removeGroupMember = (id: number, phone_number: string) =>
  apiClient
    .delete<ApiSuccess>(`/groups/${id}/remove-member`, { data: { phone_number } })
    .then((r) => r.data)

export const bulkAddMembers = (id: number, members: { phone_number: string; name?: string }[]) =>
  apiClient.post<ApiSuccess>(`/groups/${id}/bulk-add-members`, { members }).then((r) => r.data)

export const transferMember = (id: number, phone_number: string, target_group_id: number) =>
  apiClient
    .post<ApiSuccess>(`/groups/${id}/transfer-member`, { phone_number, target_group_id })
    .then((r) => r.data)

export const syncGroups = () =>
  apiClient.post<ApiSuccess>('/groups/sync').then((r) => r.data)

export const getGroupStatistics = () =>
  apiClient.get<GroupStats>('/groups/statistics').then((r) => r.data)

export const searchMembers = (q: string) =>
  apiClient
    .get<{ members: Member[] }>('/groups/members/search', { params: { q } })
    .then((r) => r.data.members)

export const getMemberDetails = (memberId: number) =>
  apiClient
    .get<{ member: Member }>(`/groups/members/${memberId}`)
    .then((r) => r.data.member)
