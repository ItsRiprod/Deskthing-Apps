import { createDeskThing } from "@deskthing/client"
import { SongData, SocketData, DEVICE_CLIENT } from "@deskthing/types"
import { ToClientTypes, ToServerTypes } from "@shared/transitTypes"
import { MusicContextType, MusicContext } from "@src/contexts/MusicContext"
import { ReactNode, useState, useRef, useCallback, useEffect } from "react"

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentSong, setCurrentSong] = useState<SongData | null>(null);
    const [backgroundColor, setBackgroundColor] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [isProgressTracking, setIsProgressTracking] = useState<boolean>(false);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Function to start tracking progress
  const startProgressTracking = useCallback(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      setIsProgressTracking(true);
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          // If we have a song and it's playing, increment progress
          if (currentSong?.is_playing && currentSong?.track_duration) {
            const newProgress = prev + 1000; // Add 1 second (1000ms)
            // Don't exceed the song duration
            return Math.min(newProgress, currentSong.track_duration);
          }
          return prev;
        });
      }, 1000);
    }, [currentSong]);
    
    // Function to stop tracking progress
    const stopProgressTracking = useCallback(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsProgressTracking(false);
    }, []);
    
    // Update progress when song changes
    useEffect(() => {
      if (currentSong) {
        setProgress(currentSong.track_progress || 0);
        
        if (currentSong.is_playing) {
          startProgressTracking();
        } else {
          stopProgressTracking();
        }
      }
      
      return () => {
        stopProgressTracking();
      };
    }, [currentSong, startProgressTracking, stopProgressTracking]);
  
    const handleMusic = useCallback(async (data: SocketData) => {
      const song = data.payload as SongData;
      setCurrentSong(song);
      if (song?.color) {
        setBackgroundColor(song.color.rgb);
      }
    }, []);
  
    useEffect(() => {
      const listeners = [
        DeskThing.on(DEVICE_CLIENT.MUSIC, handleMusic)
      ];
  
      DeskThing.getMusic().then(songData => {
        if (songData) {
          setCurrentSong(songData);
        }
      });
  
      return () => {
        listeners.forEach(removeListener => removeListener());
      };
    }, [handleMusic]);
  
    const contextValue: MusicContextType = {
      currentSong,
      backgroundColor,
      progress,
      isProgressTracking
    };
  
    return (
      <MusicContext.Provider value={contextValue}>
        {children}
      </MusicContext.Provider>
    );
  };