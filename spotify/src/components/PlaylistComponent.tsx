import { DeskThing } from "@deskthing/client";
import { Playlist } from "@shared/spotifyTypes";
import { FC, useMemo } from "react";

type PlaylistComponentProps = {
  playlist: Playlist;
};

export const PlaylistComponent: FC<PlaylistComponentProps> = ({ playlist }) => {
  const decodedImage = useMemo(
    () => DeskThing.formatImageUrl(playlist.thumbnail_url),
    [playlist.thumbnail_url]
  );

  return (
    <div>
      <h1>{playlist.title}</h1>
      <img src={decodedImage} alt={playlist.title} />
    </div>
  );
};
