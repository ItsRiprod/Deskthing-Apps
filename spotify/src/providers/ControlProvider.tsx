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
  
    const setCurrentToPreset = useCallback((playlistIndex: number) => {
      DeskThing.send({ type: SpotifyEvent.SET, request: 'current_to_preset', payload: playlistIndex });
    }, []);
  
    const playSong = useCallback((songId: string) => {
      DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.PLAY, payload: { id: songId } });
    }, []);
  
    const likeSong = useCallback((id?: string) => {
      DeskThing.send({ type: SongEvent.SET, request: AUDIO_REQUESTS.LIKE, payload: id || ''});
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
      playSong,
      seekToPosition,
      setPlaylistToPreset,
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