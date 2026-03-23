import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChurchState {
  activeChurchId: number | null
  setActiveChurch: (id: number) => void
  clearActiveChurch: () => void
}

export const useChurchStore = create<ChurchState>()(
  persist(
    (set) => ({
      activeChurchId: null,
      setActiveChurch: (id) => set({ activeChurchId: id }),
      clearActiveChurch: () => set({ activeChurchId: null }),
    }),
    { name: 'bahasha_active_church' },
  ),
)
