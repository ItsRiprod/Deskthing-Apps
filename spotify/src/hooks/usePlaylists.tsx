import { useContext } from "react"
import { PlaylistContext } from "../contexts/PlaylistContext"

// Custom hook to use the music context
export function usePlaylists() {
    const context = useContext(PlaylistContext);
    if (context === undefined) {
      throw new Error('usePlaylists must be used within a PlaylistContext');
    }
    return context;
  };
  