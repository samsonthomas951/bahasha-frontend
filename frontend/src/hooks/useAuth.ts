import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { changePassword, getProfile, login, logout, updateProfile } from '@/api/auth'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { useChurchStore } from '@/stores/churchStore'
import type { ChangePasswordPayload, LoginPayload, UpdateProfilePayload } from '@/types/auth'

export function useAuth() {
  const { isAuthenticated, user, clearAuth, setAuth, updateUser } = useAuthStore()
  const clearActiveChurch = useChurchStore((s) => s.clearActiveChurch)
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.expires_at)
      navigate('/dashboard')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth()
      clearActiveChurch()
      queryClient.clear()
      navigate('/login')
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  })

  return {
    isAuthenticated,
    user,
    loginMutation,
    logoutMutation,
    updateProfileMutation,
    changePasswordMutation,
  }
}

export function useProfile() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5,
  })
}
