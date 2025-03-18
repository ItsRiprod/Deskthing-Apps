import { DeskThing } from "@deskthing/client";
import { Playlist } from "@shared/spotifyTypes";
import { FC, useMemo } from "react";
import { SwipeContainer } from "@src/components/SwipeContainer";
import { useControls } from "@src/hooks/useControls"
import { usePlaylists } from "@src/hooks/usePlaylists"
import { X, Heart, Plus, Play } from "lucide-react"

type PresetComponentProps = {
  preset: Playlist;
};

export const PresetComponent: FC<PresetComponentProps> = ({ preset }) => {
  const { playPreset, addCurrentToPreset, setCurrentToPreset } = useControls()

  const decodedImage = useMemo(
    () => preset.thumbnail_url && DeskThing.formatImageUrl(preset.thumbnail_url),
    [preset.thumbnail_url]
  );

  const handleSwipeLeft = () => {
    // unpin
    if (preset.id === '-1')  {
      setCurrentToPreset(preset.index)
    } else {
      console.log('Removing a preset is not available')
    }
  };

  const handleSwipeRight = () => {
    addCurrentToPreset(preset.index)
  };

  const handleClick = () => {
    if (preset.id == '-1') return
    playPreset(preset.index)
  }

  return (
    <div className="bg-neutral-950 w-full rounded-xl overflow-hidden">
      <SwipeContainer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onTap={handleClick}
        swipeLeftIcon={preset.id === '-1' ? <Plus /> : <X />}
        swipeRightIcon={<Play />}
        leftTriggerColor={preset.id === '-1' ? 'bg-cyan-500' : 'bg-red-500'}
        rightTriggerColor="bg-green-500"
        className="w-full h-fit"
      >
        <div className="rounded-lg bg-neutral-900 w-full flex-nowrap flex items-center">
          {decodedImage && (
            <img
              src={decodedImage}
              alt={preset.title}
              className="h-24 w-24 object-cover rounded-lg"
            />
          )}
          <div className="flex w-full flex-col overflow-x-hidden h-full justify-center p-3">
            <div className="overflow-clip w-full">
              <h1 className="text-xl text-neutral-200 text-ellipsis text-nowrap overflow-hidden font-semibold">
                {preset.title}
              </h1>
              <p className="text-neutral-500 text-ellipsis text-nowrap overflow-hidden font-medium">{preset.owner}</p>
            </div>
          </div>
        </div>
      </SwipeContainer>
    </div>
  );
};