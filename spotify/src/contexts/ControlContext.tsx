
import { createContext } from 'react';

export type ControlContextType = {
  playPlaylist: (playlistIndex: number) => void;
  addToPlaylist: (playlistIndex: number) => void;
  setPlaylist: (playlistIndex: number) => void;
  playSong: (songId: string) => void;
  likeSong: () => void;
  seekToPosition: (positionMs: number) => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (songUri: string) => void;
};

export const ControlContext = createContext<ControlContextType | undefined>(undefined);

