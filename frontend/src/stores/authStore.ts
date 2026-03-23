import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  expiresAt: string | null
  isAuthenticated: boolean
  setAuth: (token: string | null, user: User, expiresAt: string | null) => void
  clearAuth: () => void
  updateUser: (partial: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      expiresAt: null,
      isAuthenticated: false,

      setAuth: (token, user, expiresAt) => {
        set({ token, user, expiresAt, isAuthenticated: true })
      },

      clearAuth: () => {
        set({ token: null, user: null, expiresAt: null, isAuthenticated: false })
      },

      updateUser: (partial) => {
        const user = get().user
        if (user) set({ user: { ...user, ...partial } })
      },
    }),
    {
      name: 'bahasha_auth',
      onRehydrateStorage: () => (state) => {
        // On rehydrate, check if token is expired
        if (state?.expiresAt && new Date(state.expiresAt) < new Date()) {
          state.clearAuth()
        }
      },
    },
  ),
)
