import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { createDeskThing } from '@deskthing/client';
import { AbbreviatedSong, SongQueue } from '@shared/spotifyTypes';
import { SpotifyEvent, ToClientTypes, ToServerTypes } from '@shared/transitTypes';

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>()

// Define the context type
type QueueContextType = {
  queue: AbbreviatedSong[];
  currentlyPlaying: AbbreviatedSong | null
};

// Create the context with a default value
export const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Provider component
export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<AbbreviatedSong[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<AbbreviatedSong | null>(null);

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
    currentlyPlaying
  };

  return (
    <QueueContext.Provider value={contextValue}>
      {children}
    </QueueContext.Provider>
  );
};