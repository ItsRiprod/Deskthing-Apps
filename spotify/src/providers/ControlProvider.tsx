import { createDeskThing } from "@deskthing/client"
import { SongEvent, AUDIO_REQUESTS } from "@deskthing/types"
import { ToClientTypes, ToServerTypes, SpotifyEvent } from "@shared/transitTypes"
import { ControlContext, ControlContextType } from "@src/contexts/ControlContext"
import { ReactNode, useCallback } from "react"


const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()


export const ControlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const playPlaylist = useCallback((playlistId: string) => {
    DeskThing.send({ type: SpotifyEvent.PLAY, request: 'playlist', payload: playlistId });
  }, []);

  const playPreset = useCallback((presetIndex: number) => {
    DeskThing.send({ type: SpotifyEvent.PLAY, request: 'preset', payload: presetIndex });
  }, []);

  const addCurrentToPreset = useCallback((playlistIndex: number) => {
    DeskThing.send({ type: SpotifyEvent.ADD, request: 'current_to_preset', payload: playlistIndex });
  }, []);

  const addCurrentToPlaylist = useCallback((playlistId: string) => {
    DeskThing.send({ type: SpotifyEvent.ADD, request: 'current_to_playlist', payload: playlistId });
  }, []);

  const setPlaylistToPreset = useCallback((presetIndex: number, playlistId: string) => {
    DeskThing.send({ type: SpotifyEvent.SET, request: 'preset', payload: { presetNum: presetIndex, playlistId: playlistId } });
  }, []);

  const addSongToPreset = useCallback((presetIndex: number, songId: string) => {
    DeskThing.send({ type: SpotifyEvent.ADD, request: 'song_to_preset', payload: { presetNum: presetIndex, songId: songId } });
  }, []);

  const setCurrentToPreset = useCallback((presetIndex: number) => {
    DeskThing.send({ type: SpotifyEvent.SET, request: 'current_to_preset', payload: presetIndex });
  }, []);

  const clearPresetIndex = useCallback((presetIndex: number) => {
    DeskThing.send({ type: SpotifyEvent.SET, request: 'remove_preset', payload: presetIndex });
  }, []);

  const playSong = useCallback((songId: string) => {
    DeskThing.send({ app: 'spotify', type: SpotifyEvent.SET, request: AUDIO_REQUESTS.PLAY, payload: { id: songId } });
  }, []);

  const likeSong = useCallback((id?: string) => {
    DeskThing.send({ type: SpotifyEvent.SET, request: AUDIO_REQUESTS.LIKE, payload: id || '' });
  }, []);

  const seekToPosition = useCallback((positionMs: number) => {
    DeskThing.send({
      type: SongEvent.SET,
      request: AUDIO_REQUESTS.SEEK,
      app: 'music',
      payload: positionMs
    });
  }, []);

  const pausePlayback = useCallback(() => {
    DeskThing.triggerAction({
      id: 'play',
      source: 'server'
    })
  }, []);

  const resumePlayback = useCallback(() => {
    DeskThing.triggerAction({
      id: 'play',
      source: 'server'
    })
  }, []);

  const nextTrack = useCallback(() => {
    DeskThing.triggerAction({
      id: 'skip',
      source: 'server'
    })
  }, []);

  const previousTrack = useCallback(() => {
    DeskThing.triggerAction({
      id: 'rewind',
      source: 'server'
    })
  }, []);

  const addToQueue = useCallback((songUri: string) => {
    DeskThing.send({ type: SpotifyEvent.ADD, request: 'queue', payload: songUri });
  }, []);


  const removeFromQueue = useCallback((songUri: string) => {
    DeskThing.send({ type: SpotifyEvent.REMOVE, request: 'queue', payload: songUri });
  }, []);

  const contextValue: ControlContextType = {
    playPlaylist,
    playPreset,
    addCurrentToPreset,
    addCurrentToPlaylist,
    setCurrentToPreset,
    clearPresetIndex,
    playSong,
    seekToPosition,
    setPlaylistToPreset,
    addSongToPreset,
    likeSong,
    pausePlayback,
    resumePlayback,
    nextTrack,
    addToQueue,
    removeFromQueue,
    previousTrack
  };

  return (
    <ControlContext.Provider value={contextValue}>
      {children}
    </ControlContext.Provider>
  );
};