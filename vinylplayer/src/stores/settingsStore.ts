import { DeskThing } from "@deskthing/client";
import { DEVICE_CLIENT } from "@deskthing/types";
import { RecordSettings } from "@shared/recordTypes";
import { create } from "zustand";

type SettingStore = {
  settings: RecordSettings | undefined
  initialized: boolean
  textColor: string
  bgColor: string
  init: () => Promise<void>
  setSettings: (settings: RecordSettings) => void
  fetchSettings: () => Promise<void>
}

export const useSettingStore = create<SettingStore>((set, get) => ({
  settings: undefined,
  initialized: false,
  textColor: 'white',
  bgColor: 'black',
  init: async () => {

    if (get().initialized) return // Already initialized

    DeskThing.on(DEVICE_CLIENT.SETTINGS, (data) => {
      if (!data.payload) return
      set({ settings: data.payload as RecordSettings })
    })

    const initialSettings = await DeskThing.getSettings() as RecordSettings
    if (initialSettings) set({ settings: initialSettings, textColor: initialSettings?.textColor?.value || 'white', bgColor: initialSettings?.bgColor?.value || 'black' })

    set({ initialized: true })
  },

  setSettings: (settings: RecordSettings) => set({ settings }),

  fetchSettings: async () => {
    const settings = await DeskThing.getSettings()
    if (settings) set({ settings: settings as RecordSettings })
  }

}));