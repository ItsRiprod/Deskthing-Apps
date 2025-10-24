import { create } from 'zustand';
import { Playlist, Paginated } from '@shared/spotifyTypes';
import { createDeskThing } from '@deskthing/client';
import { ToClientTypes, ToServerTypes, SpotifyEvent } from '@shared/transitTypes';

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

type PlaylistStore = {
  playlists: Paginated<Playlist>;
  presets: Playlist[];
  fetchPresets: () => void;
  fetchPlaylists: (filters?: { limit: number; startIndex: number }) => void;
};

export const usePlaylistStore = create<PlaylistStore>((set) => {
  // Listen for updates from DeskThing
  DeskThing.on('playlists', (data) => {
    set({ playlists: data.payload });
    DeskThing.debug(`Got ${data.payload.items.length} playlists`, data);
  });

  DeskThing.on('presets', (data) => {
    set({ presets: data.payload });
    DeskThing.debug('Got presets', data);
  });

  // Initial fetch
  DeskThing.send({ type: SpotifyEvent.GET, request: 'playlists' });

  return {
    playlists: {
      items: [],
      total: 0,
      limit: 0,
      startIndex: 0,
    },
    presets: [],
    fetchPresets: () => {
      DeskThing.send({ type: SpotifyEvent.GET, request: 'presets' });
    },
    fetchPlaylists: (filters) => {
      DeskThing.send({ type: SpotifyEvent.GET, request: 'playlists', payload: filters });
    },
  };
});