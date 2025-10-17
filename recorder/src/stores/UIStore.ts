import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OverlayId = 'error' | 'microphone' | 'settings' | 'recordings'

export type UIStoreState = {
  visible: Partial<Record<OverlayId, boolean>>
  flags: Record<string, boolean>
  errorMessage?: string | null
  show: (id: OverlayId, payload?: unknown) => void
  hide: (id: OverlayId) => void
  toggle: (id: OverlayId) => void
  setError: (msg: string | null) => void
  getFlag: (key: string) => boolean
  setFlag: (key: string, value: boolean) => void
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set, get) => ({
      visible: {},
      errorMessage: null,

      show: (id) =>
        set((state) => ({
          visible: { ...state.visible, [id]: true },
        })),

      hide: (id) =>
        set((state) => ({
          visible: { ...state.visible, [id]: false },
        })),

      toggle: (id) =>
        set((state) => ({
          visible: { ...state.visible, [id]: !state.visible[id] },
        })),

      setError: (msg) => set({ errorMessage: msg }),
      flags: {},

      getFlag: (key) => {
        return get().flags[key] || false
      },
      setFlag: (key, value) => {
        set((state) => ({
          flags: { ...state.flags, [key]: value },
        }))
      },
    }),
    {
      name: 'ui-store', // unique name for localStorage
      partialize: (state) => ({
        visible: state.visible,
        errorMessage: state.errorMessage,
        flags: state.flags,
      }),
    }
  )
)
