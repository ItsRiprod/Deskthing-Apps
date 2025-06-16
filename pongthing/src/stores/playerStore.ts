import { Player } from "@shared/types/lobby";
import { BaseStore } from "@src/types";
import { create } from "zustand";
import { createDeskThing } from "@deskthing/client";
import { FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER } from "@shared/types/transit";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

export interface PlayerStore extends BaseStore {
  player: Player | undefined
  updatePlayer: (player: Partial<Player>) => void
  createPlayer: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => {
  let unsubscribeFn: (() => void) | null = null;

  return {
    initialized: false,
    init: async () => {
      if (!get().initialized) {
        unsubscribeFn = DeskThing.on(GAME_SERVER.PLAYER_DATA, (data) => {
          set({ player: data.payload });
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

    player: undefined,
    updatePlayer: (player) => {
      DeskThing.send({
        type: GAME_CLIENT.PLAYER,
        request: 'update',
        payload: player
      })
    },
    createPlayer: () => {
      DeskThing.send({
        type: GAME_CLIENT.PLAYER,
        request: 'get'
      })
    }
  }
})