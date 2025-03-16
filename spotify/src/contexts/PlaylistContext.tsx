import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { createDeskThing } from '@deskthing/client';
import { Playlist } from '@shared/spotifyTypes';
import { SpotifyEvent, ToClientTypes, ToServerTypes } from '@shared/transitTypes';

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()

type PlaylistContextType = {
  playlists: Playlist[];
  presets: Playlist[];
};

export const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

// Provider component
export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [presets, setPresets] = useState<Playlist[]>([]);


  useEffect(() => {
    const listeners = [
      DeskThing.on('playlists', (data) => {
        setPlaylists(data.payload);
      }),
      DeskThing.on('preset', (data) => {
        setPresets(data.payload);
      })
    ];

    DeskThing.send({ type: SpotifyEvent.GET, request: 'playlists' });

    return () => {
      listeners.forEach(removeListener => removeListener());
    };
  }, []);

  const contextValue: PlaylistContextType = {
    playlists,
    presets
  };

  return (
    <PlaylistContext.Provider value={contextValue}>
      {children}
    </PlaylistContext.Provider>
  );
};