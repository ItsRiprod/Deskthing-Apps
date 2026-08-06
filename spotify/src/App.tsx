import React from "react";
import Player from "./Pages/Player";
import { ControlProvider } from "./providers/ControlProvider";
import { MusicProvider } from "./providers/MusicProvider";
import { QueueProvider } from "./providers/QueueProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { UIProvider } from "./providers/UIProvider";

// Playlists live in a zustand store (src/stores/playlistStore.ts), not a
// provider — every consumer reaches for usePlaylistStore directly. The
// PlaylistProvider this file used to wrap was deleted in that migration but the
// import stayed, so the app has not compiled since.

const App: React.FC = () => {
  return (
    <div className="max-w-screen max-h-screen">
      <SettingsProvider>
        <MusicProvider>
          <QueueProvider>
            <ControlProvider>
              <UIProvider>
                <Player />
              </UIProvider>
            </ControlProvider>
          </QueueProvider>
        </MusicProvider>
      </SettingsProvider>
    </div>
  );
};
export default App;
