import { DeskThing } from "@deskthing/client";
import { DEVICE_CLIENT, SongData11, ThemeColor } from "@deskthing/types";
import { create } from "zustand";
import { useSettingStore } from "./settingsStore";
import { ClockSettingIDs } from "@shared/settings";

type MusicStore = {
  songData: SongData11 | undefined
  initialized: boolean
  thumbnailUrl?: string
  isPlaying: boolean
  color: ThemeColor,
  textColor: string,
  init: () => Promise<void>
  setSong: (songData: SongData11) => void
  fetchSong: () => Promise<void>
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  songData: undefined,
  initialized: false,
  thumbnailUrl: undefined,
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
  init: async () => {
    if (get().initialized) return // Already initialized

    DeskThing.on(DEVICE_CLIENT.MUSIC, (data) => {
      if (!data.payload) return

      // The server translates all songdata to SongData11
      const currentSong = get().songData as SongData11

      const autoColor = useSettingStore.getState().settings?.[ClockSettingIDs.COLOR_OPTIONS]

      const updates: Partial<MusicStore> = {
        textColor: autoColor == 'custom' ? useSettingStore.getState().settings?.[ClockSettingIDs.COLOR] : data.payload?.color?.isLight ? 'black' : 'white',
        isPlaying: data.payload.is_playing,
        color: data.payload.color
      }

      if (data.payload.thumbnail) {
        updates.thumbnailUrl = data.payload.thumbnail
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
  }
}));