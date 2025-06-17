import { DeskThing } from "@deskthing/client";
import { DEVICE_CLIENT, SongData11, ThemeColor } from "@deskthing/types";
import { create } from "zustand";
import { useSettingStore } from "./settingsStore";
import { DISPLAY_ITEMS } from "@shared/recordTypes";

type MusicStore = {
  songData: SongData11 | undefined
  initialized: boolean
  isPlaying: boolean
  color: ThemeColor,
  textColor: string,
  bgColor: string,
  init: () => Promise<void>
  setSong: (songData: SongData11) => void
  fetchSong: () => Promise<void>
  playPause: () => Promise<void>
  volumeUp: () => Promise<void>
  volumeDown: () => Promise<void>
  skip: () => Promise<void>
  rewind: () => Promise<void>
  shuffle: () => Promise<void>

  repeat: (repeat: boolean) => Promise<void>
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  songData: undefined,
  initialized: false,
  isPlaying: false,
  color: {
    value: [0, 0, 0],
    rgb: 'rgb(0, 0, 0)',
    rgba: 'rgba(0, 0, 0, 1)',
    hex: '#000000',
    hexa: '#000000FF',
    isDark: true,
    isLight: false,
    error: undefined
  },
  textColor: 'white',
  bgColor: 'rgb(0, 0, 0)',
  init: async () => {
    if (get().initialized) return // Already initialized

    DeskThing.on(DEVICE_CLIENT.MUSIC, (data) => {
      if (!data.payload) return

      // The server translates all songdata to SongData11
      const currentSong = get().songData as SongData11

      const displayValues = useSettingStore.getState().settings?.display.value
      const isDarkened = displayValues?.includes(DISPLAY_ITEMS.BG_DARKENED)
      const customColor = displayValues?.includes(DISPLAY_ITEMS.CUSTOM_TEXT)
      const customBg = displayValues?.includes(DISPLAY_ITEMS.CUSTOM_BG)

      // If the background is darkened, assert it as darkened
      if (isDarkened && data.payload.color) data.payload.color = { ...data.payload.color, value: data.payload.color.value || [0, 0, 0], isDark: true, isLight: false }

      const updates: Partial<MusicStore> = {
        textColor: customColor ? useSettingStore.getState().textColor : data.payload?.color?.isLight ? 'black' : 'white',
        bgColor: customBg ? useSettingStore.getState().bgColor : data.payload?.color?.rgb || 'rgb(0, 0, 0)',
        isPlaying: data.payload.is_playing,
        color: data.payload.color
      }

      if (currentSong && currentSong.id === data.payload.id) {
        // merge - they are the same song
        updates.songData = { ...currentSong, ...data.payload as SongData11 }
      } else {
        // don't merge - this may overwrite the thumbnail
        updates.songData = data.payload as SongData11
      }

      set(updates)
    })
    const initialSongData = await DeskThing.getMusic() as SongData11
    if (initialSongData) set({ songData: initialSongData, isPlaying: initialSongData.is_playing })

    set({ initialized: true })
  },

  setSong: (songData: SongData11) => set({ songData }),

  fetchSong: async () => {
    const songData = await DeskThing.getMusic() as SongData11
    if (songData) set({ songData })
  },

  playPause: async () => {
    await DeskThing.triggerAction({
      id: 'play',
      source: 'server',
      enabled: true
    })
    set(state => ({ isPlaying: !state.isPlaying }))
  },

  skip: async () => {
    await DeskThing.triggerAction({
      id: 'skip',
      source: 'server'
    })
  },

  rewind: async () => {
    await DeskThing.triggerAction({
      id: "rewind",
      source: 'server'
    })
  },

  shuffle: async () => {
    await DeskThing.triggerAction({
      id: 'shuffle',
      source: 'server'
    })
  },
  volumeUp: async () => {
    await DeskThing.triggerAction({
      id: 'volup',
      source: 'server'
    })
  },
  volumeDown: async () => {
    await DeskThing.triggerAction({
      id: 'voldown',
      source: 'server'
    })
  },

  repeat: async (repeat: boolean) => {
    await DeskThing.triggerAction({
      id: 'repeat',
      source: 'server',
      value: repeat ? 'all' : 'off'
    })
  }
}));