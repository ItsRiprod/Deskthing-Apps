
import { createContext } from 'react';

export type Page = 'chat' | 'guild' | 'call';

export type UIContextType = {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
};

export const UIContext = createContext<UIContextType | undefined>(undefined);

