import { GamePages } from "@shared/types/types";
import { create } from "zustand";
import { createDeskThing } from "@deskthing/client";
import { FromClientToServer, FromServerToClient, GAME_SERVER } from "@shared/types/transit";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

export interface UIStore {
  currentPage: GamePages
  setCurrentPage: (page: GamePages) => void
  goBack: () => void
  initialized: boolean
  init: () => Promise<void>
  unmount: () => Promise<void>
}

export const useUIStore = create<UIStore>((set, get) => {
  let history: GamePages[] = ['player'];
  let unsubscribeFn: (() => void) | null = null;

  return {
    initialized: false,
    init: async () => {
      if (!get().initialized) {
        unsubscribeFn = DeskThing.on(GAME_SERVER.META, (data) => {
          if (data.request === 'page') {
            get().setCurrentPage(data.payload);
          }
        });
        set({ initialized: true });
      }
    },
    unmount: async () => {
      if (unsubscribeFn) {
        unsubscribeFn();
        unsubscribeFn = null;
      }
      set({ initialized: false });
    },
    currentPage: 'player',
    setCurrentPage: (page) => {
      history.push(page);
      set({ currentPage: page })
    },
    goBack: () => {
      if (history.length > 1) {
        history.pop();
        set({ currentPage: history[history.length - 1] })
      }
    }
  }
})