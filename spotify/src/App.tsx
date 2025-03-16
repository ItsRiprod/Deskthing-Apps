import React from "react";
import Player from "./Pages/Player";
import { SettingsProvider } from "./contexts/SettingsContext";
import { MusicProvider } from "./contexts/MusicContext";
import { ControlProvider } from "./contexts/ControlContext";
import { PanelManager } from "./panels/PanelManager";
import { UIProvider } from "./contexts/UIContext";

const App: React.FC = () => {
  return (
    <div>
      <SettingsProvider>
        <MusicProvider>
          <ControlProvider>
            <UIProvider>
              <PanelManager />
              <Player />
            </UIProvider>
          </ControlProvider>
        </MusicProvider>
      </SettingsProvider>
    </div>
  );
};
export default App;
