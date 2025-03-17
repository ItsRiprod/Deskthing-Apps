import { DeskThing } from "@deskthing/client";
import { AbbreviatedSong } from "@shared/spotifyTypes";
import { FC, useMemo } from "react";
import { SwipeContainer } from "@src/components/SwipeContainer";
import { useControls } from "@src/hooks/useControls"
import { Heart, X } from "lucide-react"

type SongComponentProps = {
  song: AbbreviatedSong;
};

export const SongComponent: FC<SongComponentProps> = ({ song }) => {
  const { addToQueue, nextTrack, likeSong } = useControls()
  const decodedImage = useMemo(
    () => song.thumbnail && DeskThing.formatImageUrl(song.thumbnail),
    [song.thumbnail]
  );

  const handleSwipeLeft = () => {
    likeSong(song.id)
  };

  const handleSwipeRight = () => {
    // Handle swipe right action
  };

  const handleClick = () => {
    addToQueue(song.id)
    setTimeout(() => nextTrack(), 100)
  }

  return (
    <div className="w-full rounded-xl overflow-hidden hover:bg-neutral-900">
      <SwipeContainer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onTap={handleClick}
        swipeLeftIcon={<X />}
        swipeRightIcon={<Heart />}
        leftTriggerColor="bg-red-500"
        rightTriggerColor="bg-green-500"
        className="w-full h-fit"
      >
        <div className="rounded-lg w-full flex-nowrap flex items-center">
          {decodedImage && (
            <img
              src={decodedImage}
              alt={song.name}
              className="h-24 w-24 object-cover rounded-lg"
            />
          )}
          <div className="flex w-full flex-col overflow-x-hidden h-full justify-center p-3">
            <div className="overflow-clip w-full">
              <h1 className="text-xl text-neutral-200 text-ellipsis text-nowrap overflow-hidden font-semibold">
                {song.name}
              </h1>
              <p className=" text-neutral-500 text-ellipsis text-nowrap overflow-hidden font-medium">{song.artists.join(", ")}</p>
            </div>
          </div>
        </div>
      </SwipeContainer>
    </div>
  );
};
