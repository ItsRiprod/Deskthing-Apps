import { create } from 'zustand';
import { BaseStore } from '@src/types';
import { createDeskThing } from "@deskthing/client";
import { ClientGamePayload, FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER } from "@shared/types/transit";
import { GameState } from '@shared/types';

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

export interface GameStore extends BaseStore {
  gameState: GameState | undefined;
  setGameState: (gameState: GameState, sendToServer?: boolean) => void;
  sendGameData: (data: ClientGamePayload) => void;
  endGame: (winnerIds: string[]) => void;
  startGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  let unsubscribeFn: (() => void) | null = null;

  return {
    initialized: false,
    init: async () => {
      if (!get().initialized) {
        unsubscribeFn = DeskThing.on(GAME_SERVER.GAME_DATA, (data) => {
          set({ gameState: data.payload });
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
    gameState: undefined,
    setGameState: (gameState, sendToServer = true) => {
      set({ gameState });
      // sending to server not implemented yet
    },
    sendGameData: (data) => {
      DeskThing.send({
        type: GAME_CLIENT.GAME_UPDATE,
        request: 'update',
        payload: data,
      })
    },
    endGame: (winners: string[]) => {
      set((prev) => ({ gameState: prev.gameState ? { ...prev.gameState, isCompleted: true } : undefined }))
      DeskThing.send({
        type: GAME_CLIENT.GAME_UPDATE,
        request: 'end',
        payload: { winnerIds: winners }
      })
    },
    startGame: () => {
      DeskThing.send({
        type: GAME_CLIENT.GAME_UPDATE,
        request: 'start',
      })
    }
  }
});