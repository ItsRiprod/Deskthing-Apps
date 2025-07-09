import { create } from 'zustand';

export type Page = 'chat' | 'guild' | 'call';

type UIStore = {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'guild',
  setCurrentPage: (page) => set({ currentPage: page }),
}));