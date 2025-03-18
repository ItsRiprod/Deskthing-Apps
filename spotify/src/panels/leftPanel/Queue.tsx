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
    <div className="h-full flex flex-col w-full p-4 pt-0">
      <div className="">
        <p className="text-xl font-bold text-neutral-500 mb-2 font-geist">
          Now Playing
        </p>
        {currentlyPlaying && (
          <div className="max-w-full overflow-clip mb-4">
            <SongComponent song={currentlyPlaying} />
          </div>
        )}
        <p className="text-xl font-bold text-neutral-500 mb-2 font-geist">Up Next</p>
      </div>
      <div className="overflow-y-scroll w-full h-full rounded-xl">
        {queue.map((song, index) => (
          <div key={index} className="max-w-full w-full overflow-y-hidden mb-2">
            <SongComponent song={song} />
          </div>
        ))}
      </div>
    </div>
  );
};
