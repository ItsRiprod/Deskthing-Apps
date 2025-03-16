import { createDeskThing } from "@deskthing/client"
import { SongEvent, AUDIO_REQUESTS } from "@deskthing/types"
import { ToClientTypes, ToServerTypes, SpotifyEvent } from "@shared/transitTypes"
import { ControlContext, ControlContextType } from "@src/contexts/ControlContext"
import { ReactNode, useCallback } from "react"


const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()


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

    const addToQueue = useCallback((songUri: string) => {
      DeskThing.send({ type: SpotifyEvent.SET, request: 'add_queue', payload: songUri });
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
      addToQueue,
      previousTrack
    };
  
    return (
      <ControlContext.Provider value={contextValue}>
        {children}
      </ControlContext.Provider>
    );
  };