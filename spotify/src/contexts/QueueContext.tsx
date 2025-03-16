import { createContext } from "react";
import { AbbreviatedSong } from "@shared/spotifyTypes";

// Define the context type
export type QueueContextType = {
  queue: AbbreviatedSong[];
  currentlyPlaying: AbbreviatedSong | null;
  fetchQueue: () => void
};

// Create the context with a default value
export const QueueContext = createContext<QueueContextType | undefined>(
  undefined
);
