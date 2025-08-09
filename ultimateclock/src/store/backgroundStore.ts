import { createDeskThing } from "@deskthing/client";
import { create } from "zustand";
import { ToClientData, ToServerData } from "@shared/transit";

const DeskThing = createDeskThing<ToClientData, ToServerData>();

type BackgroundStore = {
  backgroundUrl: string | undefined
  initialized: boolean
  init: () => Promise<void>
}

export const useBackgroundStore = create<BackgroundStore>((set, get) => ({
  backgroundUrl: undefined,
  initialized: false,
  init: async () => {
    if (get().initialized) return // Already initialized

    DeskThing.on('image', (data) => {
      if (!data.payload) return

      if (data.request === 'data') {
        console.log('Received background image URL:', data.payload);
        const url = data.payload.includes('http://localhost') ? DeskThing.formatImageUrl(data.payload) : DeskThing.useProxy(data.payload)
        console.log('Formatted background image URL:', url);
        set({ backgroundUrl: url });
      }
    })

    DeskThing.send({ type: 'image', request: 'request', payload: 'background' });

    set({ initialized: true })
  },
}));