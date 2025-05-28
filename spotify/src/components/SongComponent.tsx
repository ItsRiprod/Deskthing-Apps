import { DeskThing } from "@deskthing/client";
import { AbbreviatedSong } from "@shared/spotifyTypes";
import { FC, useMemo, useState } from "react";
import { SwipeContainer } from "@src/components/SwipeContainer";
import { useControls } from "@src/hooks/useControls"
import { Heart, Plus, X } from "lucide-react"
import { AddToPresetOverlay } from "./AddToPresetOverlay";

type SongComponentProps = {
  song: AbbreviatedSong;
};

export const SongComponent: FC<SongComponentProps> = ({ song }) => {
  const { addToQueue, nextTrack, likeSong, addSongToPreset } = useControls()
  const decodedImage = useMemo(
    () => song.thumbnail && DeskThing.useProxy(song.thumbnail),
    [song.thumbnail]
  );
  const [addToPresets, setAddToPreset] = useState(false);

  const handleSwipeLeft = () => {
    setAddToPreset(true);
  };
  
  const handleSwipeRight = () => {
    likeSong(song.id)
  };

  const handleClick = () => {
    addToQueue(song.id)
    setTimeout(() => nextTrack(), 100)
  }

  const onAddClick = (index: number) => {
    addSongToPreset(index, song.id)
  };

  return (
    <div className="w-full rounded-xl overflow-hidden hover:bg-neutral-900">
      {addToPresets && (
        <AddToPresetOverlay
          onClose={() => setAddToPreset(false)}
          onPresetSelect={onAddClick}
        />
      )}
      <SwipeContainer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onTap={handleClick}
        swipeLeftIcon={<div className="flex flex-col items-center"><Plus /><p>Add</p></div>}
        swipeRightIcon={<div className="flex flex-col items-center"><Heart /><p>Like</p></div>}
        leftTriggerColor="bg-green-500"
        rightTriggerColor="bg-red-500"
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
