import { create } from 'zustand';
import { BaseStore } from '@src/types';
import { createDeskThing } from "@deskthing/client";
import { ClientGamePayload, FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER, ServerGamePayload } from "@shared/types/transit";
import { GameState } from '@shared/types';

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

type GameEvent = {
    type: GAME_SERVER.GAME_UPDATE
    request: 'update',
    payload: ServerGamePayload
  }

export interface GameStore extends BaseStore {
  gameState: GameState | null;
  setGameState: (gameState: GameState | null, sendToServer?: boolean) => void;
  sendGameData: (data: ClientGamePayload) => void;
  endGame: (winnerIds: string[]) => void;
  startGame: () => void;
  subscribeToGameUpdates: (callback: (data: GameEvent) => void) => () => void;
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
    gameState: null,
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
    },
    subscribeToGameUpdates: (callback) => {
      return DeskThing.on(GAME_SERVER.GAME_UPDATE, callback);
    }
  }
});