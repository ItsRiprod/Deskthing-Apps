import { createContext } from "react";
import { SongData } from "@deskthing/types";

export type MusicContextType = {
  currentSong: SongData | null;
  backgroundColor: string;
  progress: number;
  isProgressTracking: boolean;
};

export const MusicContext = createContext<MusicContextType | undefined>(
  undefined
);
