import { createContext } from 'react';
import { Playlist } from '@shared/spotifyTypes';

export type PlaylistContextType = {
  playlists: Playlist[];
  presets: Playlist[];
  fetchPresets: () => void;
  fetchPlaylists: () => void;
};

export const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);