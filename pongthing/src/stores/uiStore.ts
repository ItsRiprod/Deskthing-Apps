import { GAME_OPTIONS } from "@shared/types/types";
import { create } from "zustand";

export type GamePages = 'lobby' | 'room' | GAME_OPTIONS | 'menu' | 'player';

export interface UIStore {
  currentPage: GamePages
  setCurrentPage: (page: GamePages) => void
  goBack: () => void
}

export const useUIStore = create<UIStore>((set, get) => {

  let history: GamePages[] = ['player'];

  return {
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
    }  }
})