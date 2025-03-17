import { PanelState, PanelType, UIContext } from "@src/contexts/UIContext"
import { useState } from "react"

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
    const [panel, setPanel] = useState<PanelType>(null);
    const [panelState, setPanelState] = useState<PanelState>('Queue');
  
    return (
      <UIContext.Provider value={{ panel, setPanel, panelState, setPanelState }}>
        {children}
      </UIContext.Provider>
    );
  }