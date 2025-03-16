import { useContext } from "react"
import { PlaylistContext } from "../contexts/PlaylistContext"

// Custom hook to use the music context
export const usePlaylists = () => {
    const context = useContext(PlaylistContext);
    if (context === undefined) {
      throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
  };
  