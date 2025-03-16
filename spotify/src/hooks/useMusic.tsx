import { useContext } from "react"
import { MusicContext } from "../contexts/MusicContext"

// Custom hook to use the music context
export function useMusic() {
    const context = useContext(MusicContext);
    if (context === undefined) {
      throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
  };  