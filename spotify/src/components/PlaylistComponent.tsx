import { DeskThing } from "@deskthing/client";
import { Playlist } from "@shared/spotifyTypes";
import { FC, useMemo } from "react";
import { SwipeContainer } from "@src/components/SwipeContainer";
import { useControls } from "@src/hooks/useControls"
import { Heart, Pin, Plus, X } from "lucide-react"

type PlaylistComponentProps = {
  playlist: Playlist;
};

export const PlaylistComponent: FC<PlaylistComponentProps> = ({ playlist }) => {
  const { playPlaylist, setPlaylistToPreset, addCurrentToPlaylist } = useControls()
  const decodedImage = useMemo(
    () => playlist.thumbnail_url && DeskThing.formatImageUrl(playlist.thumbnail_url),
    [playlist.thumbnail_url]
  );

  const handleSwipeLeft = () => {
    setPlaylistToPreset(playlist.index, playlist.id)
  };

  const handleSwipeRight = () => {
    addCurrentToPlaylist(playlist.id)
  };

  const handleClick = () => {
    playPlaylist(playlist.id)
  }

  return (
    <div className="bg-neutral-950 w-full rounded-xl overflow-hidden">
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
        <div className="rounded-lg bg-neutral-900 w-full flex-nowrap flex items-center">
          {decodedImage && (
            <img
              src={decodedImage}
              alt={playlist.title}
              className="h-24 w-24 object-cover rounded-lg"
            />
          )}
          <div className="flex w-full ml-2 flex-col overflow-x-hidden h-full justify-center">
            <div className="overflow-clip w-full">
              <h1 className="text-xl text-zinc-200 text-ellipsis text-nowrap font-bold mb-2">
                {playlist.title}
              </h1>
              <p className="text-gray-400 text-ellipsis overflow-y-hidden">{playlist.owner}</p>
            </div>
          </div>
        </div>
      </SwipeContainer>
    </div>
  );
};