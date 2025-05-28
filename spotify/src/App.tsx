import React from "react";
import Player from "./Pages/Player";
import { PanelManager } from "./panels/PanelManager";
import { ControlProvider } from "./providers/ControlProvider";
import { MusicProvider } from "./providers/MusicProvider";
import { QueueProvider } from "./providers/QueueProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { UIProvider } from "./providers/UIProvider";
import { PlaylistProvider } from "./providers/PlaylistProvider";

const App: React.FC = () => {
  return (
    <div className="max-w-screen max-h-screen">
      <SettingsProvider>
        <MusicProvider>
          <PlaylistProvider>
            <QueueProvider>
              <ControlProvider>
                <UIProvider>
                  <Player />
                </UIProvider>
              </ControlProvider>
            </QueueProvider>
          </PlaylistProvider>
        </MusicProvider>
      </SettingsProvider>
    </div>
  );
};
export default App;
