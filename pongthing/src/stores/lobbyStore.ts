import { createDeskThing } from "@deskthing/client";
import { Lobby, Room } from "@shared/types/lobby";
import { FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER } from "@shared/types/transit";
import { GAME_OPTIONS } from "@shared/types/types";
import { BaseStore } from "@src/types";
import { create } from "zustand";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

export interface LobbyStore extends BaseStore {
  lobby: Lobby | null;
  currentRoom: Room | null
  refreshLobby: () => void
  refreshCurrentRoom: () => void
  createRoom: (color: string, game: GAME_OPTIONS) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  
  // Functions for while you are in a room
  startGame: () => void;
  readyUp: () => void;
  unready: () => void;
  changeGame: (game: GAME_OPTIONS) => void;
  changeColor: (color: string) => void;
}

export const useLobbyStore = create<LobbyStore>((set, get) => {
  // Hold the unsubscribe code outside the state so it may be unsubscribed from later
  let unsubscribeLobbyFn: (() => void) | null = null;
  let unsubscribeRoomFn: (() => void) | null = null;

  return {
    initialized: false,
    init: async () => {
      if (!get().initialized) {
        unsubscribeLobbyFn = DeskThing.on(GAME_SERVER.LOBBY_STATE, (data) => {
          set({ lobby: data.payload });
        });
        unsubscribeRoomFn = DeskThing.on(GAME_SERVER.ROOMS_UPDATE, (data) => {
          set({ currentRoom: data.payload });
        });
        set({ initialized: true });
      }
    },
    unmount: async () => {
      if (unsubscribeLobbyFn) {
        unsubscribeLobbyFn();
        unsubscribeLobbyFn = null;
      }
      if (unsubscribeRoomFn) {
        unsubscribeRoomFn();
        unsubscribeRoomFn = null;
      }
      set({ initialized: false, lobby: null });
    },
    lobby: null,
    currentRoom: null,
    refreshLobby: () => {
      set({ lobby: null });
      DeskThing.send({ type: GAME_CLIENT.LOBBY, request: 'get' });
    },
    refreshCurrentRoom: () => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'get' });
    },
    createRoom: (color, game) => {
      console.log(`Creating room ${color} for game ${game}...`)
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'create', payload: { color, game } });
    },
    joinRoom: (roomId) => {
      // Skip if you are already in the current room
      if (get().currentRoom?.id == roomId) return

      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'join', payload: { roomId } });
      // set the current room to the room that was just joined
      set({ currentRoom: null });
    },
    leaveRoom: () => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'leave' });
      // clear the current room
      set({ currentRoom: null });
    },
    startGame: () => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'start' });
    },
    readyUp: () => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'ready', payload: true });
    },
    unready: () => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'ready', payload: false });
    },
    changeGame: (game) => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'update', payload: { game } });
    },
    changeColor: (color) => {
      DeskThing.send({ type: GAME_CLIENT.ROOM, request: 'update', payload: { color } });
    }
  }
})