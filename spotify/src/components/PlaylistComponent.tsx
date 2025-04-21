import { DeskThing } from "@deskthing/client";
import { Playlist } from "@shared/spotifyTypes";
import { FC, useMemo, useState } from "react";
import { SwipeContainer } from "@src/components/SwipeContainer";
import { useControls } from "@src/hooks/useControls";
import { Pin, Plus } from "lucide-react";
import { AddToPresetOverlay } from "./AddToPresetOverlay";

type PlaylistComponentProps = {
  playlist: Playlist;
};

export const PlaylistComponent: FC<PlaylistComponentProps> = ({ playlist }) => {
  const { playPlaylist, setPlaylistToPreset, addCurrentToPlaylist } =
    useControls();
  const [addToPresets, setAddToPreset] = useState(false);
  const decodedImage = useMemo(
    () =>
      playlist.thumbnail_url &&
      DeskThing.useProxy(playlist.thumbnail_url),
    [playlist.thumbnail_url]
  );

  const handleSwipeLeft = () => {
    setAddToPreset(true);
  };

  const handleSwipeRight = () => {
    addCurrentToPlaylist(playlist.id);
  };

  const onAddClick = (index: number) => {
    setAddToPreset(true);
    setPlaylistToPreset(index, playlist.id);
  };

  const handleClick = () => {
    playPlaylist(playlist.id);
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
        swipeLeftIcon={<Pin />}
        swipeRightIcon={<Plus />}
        leftTriggerColor="bg-cyan-500"
        rightTriggerColor="bg-green-500"
        className="w-full h-fit"
      >
        <div className="w-full flex-nowrap flex items-center">
          {decodedImage && (
            <img
              src={decodedImage}
              alt={playlist.title}
              className="h-24 w-24 object-cover rounded-lg"
            />
          )}
          <div className="flex w-full flex-col overflow-x-hidden h-full justify-center p-3">
            <div className="overflow-clip w-full">
              <h1 className="text-xl text-neutral-200 text-ellipsis text-nowrap overflow-hidden font-semibold">
                {playlist.title}
              </h1>
              <p className="text-neutral-500 text-ellipsis text-nowrap overflow-hidden font-medium">
                {playlist.owner}
              </p>
            </div>
          </div>
        </div>
      </SwipeContainer>
    </div>
  );
};
