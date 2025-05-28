
import { CONTROL_OPTIONS, DISPLAY_ITEMS } from '@shared/spotifyTypes';
import { createContext } from 'react';

export type PanelType = 'left' | 'right' | null;
export type PanelState = 'Queue' | 'Playlists';

export interface UIContextType {
  panel: PanelType;
  setPanel: React.Dispatch<React.SetStateAction<PanelType>>;
  panelState: PanelState;
  setPanelState: (panelState: PanelState) => void;
  isLoading: boolean;
  displayItems: DISPLAY_ITEMS[];
  controlOptions: CONTROL_OPTIONS;
  textJustification: 'left' | 'center' | 'right';
  backdropBlur: number
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
