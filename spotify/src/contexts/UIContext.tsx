
import { createContext, useState } from 'react';

type PanelType = 'left' | 'right' | null;
type PanelState = 'presets' | 'queue' | 'playlists' | null;

export interface UIContextType {
  panel: PanelType;
  setPanel: (panel: PanelType) => void;
  panelState: PanelState;
  setPanelState: (panelState: PanelState) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [panel, hiddenSetPanel] = useState<PanelType>(null);
  const [panelState, setPanelState] = useState<PanelState>(null);

  const setPanel = (newPanel: PanelType) => {
    hiddenSetPanel((state) => state === null ? newPanel : null)
  }

  return (
    <UIContext.Provider value={{ panel, setPanel, panelState, setPanelState }}>
      {children}
    </UIContext.Provider>
  );
}
