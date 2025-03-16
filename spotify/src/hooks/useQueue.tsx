import { useContext } from "react"
import { QueueContext } from "../contexts/QueueContext"

// Custom hook to use the queue context
export const useQueue = () => {
    const context = useContext(QueueContext);
    if (context === undefined) {
      throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
  };
  