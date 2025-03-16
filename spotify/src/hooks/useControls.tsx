import { useContext } from "react"
import { ControlContext } from "../contexts/ControlContext"

// Custom hook to use the music context
export function useControls() {
    const context = useContext(ControlContext);
    if (context === undefined) {
      throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
  };
  