import { DeskThing } from "@deskthing/client";
import { Playlist } from "@shared/spotifyTypes";
import { FC, useMemo } from "react";
import { SwipeContainer } from "@src/components/SwipeContainer";

type PresetComponentProps = {
  preset: Playlist;
};

export const PresetComponent: FC<PresetComponentProps> = ({ preset }) => {
  const decodedImage = useMemo(
    () => DeskThing.formatImageUrl(preset.thumbnail_url),
    [preset.thumbnail_url]
  );

  const handleSwipeLeft = () => {
    console.log("Swiped left");
  };

  const handleSwipeRight = () => {
    console.log("Swiped right");
  };

  return (
    <SwipeContainer
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      swipeLeftIcon={<div>←</div>}
      swipeRightIcon={<div>→</div>}
      className="w-full"
    >
      <div>
        <h1>{preset.title}</h1>
        <img src={decodedImage} alt={preset.title} />
      </div>
    </SwipeContainer>
  );
};