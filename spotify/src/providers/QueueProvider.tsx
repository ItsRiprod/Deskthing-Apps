import { createDeskThing } from "@deskthing/client"
import { AbbreviatedSong } from "@shared/spotifyTypes"
import { ToClientTypes, ToServerTypes, SpotifyEvent } from "@shared/transitTypes"
import { QueueContext, QueueContextType } from "@src/contexts/QueueContext"
import { ReactNode, useState, useEffect, useCallback } from "react"

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()


export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<AbbreviatedSong[]>([]);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<AbbreviatedSong | null>(null);
  
    const fetchQueue = useCallback(() => {
      DeskThing.send({ type: SpotifyEvent.GET, request: 'queue', app: 'spotify' });
    }, []);

    useEffect(() => {
      const listeners = [
        DeskThing.on('queueData', (data) => {
          if (data) {
            setQueue(data.payload.queue);
            setCurrentlyPlaying(data.payload.currently_playing);
          }
        })
      ];
  
      DeskThing.send({ type: SpotifyEvent.GET, request: 'queue', app: 'spotify' });
  
      return () => {
        listeners.forEach(removeListener => removeListener());
      };
    }, []);
  
    const contextValue: QueueContextType = {
      queue,
      currentlyPlaying,
      fetchQueue
    };
  
    return (
      <QueueContext.Provider value={contextValue}>
        {children}
      </QueueContext.Provider>
    );
  };