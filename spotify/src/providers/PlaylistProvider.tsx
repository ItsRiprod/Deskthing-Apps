import { createDeskThing } from "@deskthing/client"
import { Playlist } from "@shared/spotifyTypes"
import { ToClientTypes, ToServerTypes, SpotifyEvent } from "@shared/transitTypes"
import { PlaylistContext, PlaylistContextType } from "@src/contexts/PlaylistContext"
import { ReactNode, useState, useCallback, useEffect } from "react"

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()


export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [presets, setPresets] = useState<Playlist[]>([]);
  
    const fetchPresets = useCallback(async () => {
      DeskThing.send({ type: SpotifyEvent.GET, request: 'presets' });
    }, []);
  
    const fetchPlaylists = useCallback(async () => {
      DeskThing.send({ type: SpotifyEvent.GET, request: 'playlists' });
    }, []);
  
  
    useEffect(() => {
      const listeners = [
        DeskThing.on('playlists', (data) => {
          setPlaylists(data.payload);
          DeskThing.debug(`Got ${data.payload.length} playlists`, data)
        }),
        DeskThing.on('presets', (data) => {
          setPresets(data.payload);
          DeskThing.debug('Got presets', data)
        })
      ];
  
      DeskThing.send({ type: SpotifyEvent.GET, request: 'playlists' });
  
      return () => {
        listeners.forEach(removeListener => removeListener());
      };
    }, []);
  
    const contextValue: PlaylistContextType = {
      playlists,
      presets,
      fetchPresets,
      fetchPlaylists
    };
  
    return (
      <PlaylistContext.Provider value={contextValue}>
        {children}
      </PlaylistContext.Provider>
    );
  };