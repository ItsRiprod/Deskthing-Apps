import { SongComponent } from "@src/components/SongComponent";
import { useQueue } from "../../hooks/useQueue";
import { useMusic } from "@src/hooks/useMusic";
import { useEffect } from "react";

export const Queue = () => {
  const { queue, currentlyPlaying, fetchQueue } = useQueue();
  const { currentSong } = useMusic();

  useEffect(() => {
    // This ensures the queue only updates if the queue is open
    if (currentSong?.id !== currentlyPlaying?.id) {
      fetchQueue();
    }
  }, [currentSong?.id]);

  return (
    <div className="h-full flex flex-col w-full">
      <div className="h-full">
        <p className="text-xl text-zinc-500 my-5 font-geist pl-4">
          Now Playing
        </p>
        {currentlyPlaying && (
          <div className="max-w-full overflow-clip">
            <SongComponent song={currentlyPlaying} />
          </div>
        )}
        <p className="text-xl text-zinc-500 my-5 font-geist pl-4">Up Next</p>
      </div>
      <div className="overflow-y-scroll w-full h-full">
        {queue.map((song, index) => (
          <div key={index} className="max-w-full w-full overflow-y-hidden mb-4">
            <SongComponent song={song} />
          </div>
        ))}
      </div>
    </div>
  );
};
