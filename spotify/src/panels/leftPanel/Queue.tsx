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
    <div className="h-full overflow-y-scroll flex flex-col w-full p-4 pt-0">
      <div className="">
        <h1 className="text-xl font-bold text-neutral-500 mb-2 font-geist">
          Now Playing
        </h1>
        {currentlyPlaying ? (
          <div className="max-w-full overflow-clip mb-4">
            <SongComponent song={currentlyPlaying} />
          </div>
        ) : (
          <div className="w-full py-10 flex items-center justify-center">
            <p className="text-xl text-neutral-500 font-geist">
              No song playing
            </p>
          </div>
        )}
        <h1 className="text-xl font-bold text-neutral-500 mb-2 font-geist">
          Up Next
        </h1>
      </div>
      <div className="w-full rounded-xl">
        {queue.length > 0 ? (
          queue.map((song, index) => (
            <div
              key={index}
              className="max-w-full w-full mb-2"
            >
              <SongComponent song={song} />
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xl py-10 text-neutral-500 font-geist">
              Queue is Empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
