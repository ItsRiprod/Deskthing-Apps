
import React, { createContext, useCallback, ReactNode } from 'react';
import { createDeskThing } from '@deskthing/client';
import { SongEvent, AUDIO_REQUESTS } from '@deskthing/types';
import { SpotifyEvent, ToClientTypes, ToServerTypes } from '@shared/transitTypes';

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()

type ControlContextType = {
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
};

export const ControlContext = createContext<ControlContextType | undefined>(undefined);

export const ControlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const playPlaylist = useCallback((playlistIndex: number) => {
    const playlistSTring = playlistIndex.toString()
    DeskThing.send({ type: SpotifyEvent.SET, request: 'play_playlist', payload: playlistSTring });
  }, []);

  const addToPlaylist = useCallback((playlistIndex: number) => {
    DeskThing.send({ type: SpotifyEvent.SET, request: 'add_preset', payload: playlistIndex });
  }, []);

  const setPlaylist = useCallback((playlistIndex: number) => {
    DeskThing.send({ type: SpotifyEvent.SET, request: 'set_preset', payload: playlistIndex });
  }, []);

  const playSong = useCallback((songId: string) => {
    DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.PLAY, payload: { id: songId } });
  }, []);

  const likeSong = useCallback(() => {
    DeskThing.send({ type: SpotifyEvent.SET, request: 'like_song' });
  }, []);

  const seekToPosition = useCallback((positionMs: number) => {
    DeskThing.send({ 
      type: SongEvent.SET, 
      request: AUDIO_REQUESTS.SEEK, 
      app: 'client',
      payload: positionMs 
    });
  }, []);

  const pausePlayback = useCallback(() => {
    DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.PAUSE });
  }, []);

  const resumePlayback = useCallback(() => {
    DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.PLAY });
  }, []);

  const nextTrack = useCallback(() => {
    DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.NEXT });
  }, []);

  const previousTrack = useCallback(() => {
    DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.PREVIOUS });
  }, []);

  const contextValue: ControlContextType = {
    playPlaylist,
    addToPlaylist,
    setPlaylist,
    playSong,
    seekToPosition,
    likeSong,
    pausePlayback,
    resumePlayback,
    nextTrack,
    previousTrack
  };

  return (
    <ControlContext.Provider value={contextValue}>
      {children}
    </ControlContext.Provider>
  );
};
