
import { createContext } from 'react';

export type PanelType = 'left' | 'right' | null;
export type PanelState = 'Queue' | 'Playlists';

export interface UIContextType {
  panel: PanelType;
  setPanel: React.Dispatch<React.SetStateAction<PanelType>>;
  panelState: PanelState;
  setPanelState: (panelState: PanelState) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
