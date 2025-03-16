import { DeskThing } from "@deskthing/client";
import { AbbreviatedSong } from "@shared/spotifyTypes";
import { FC, useMemo } from "react";

type SongComponentProps = {
  song: AbbreviatedSong;
};

export const SongComponent: FC<SongComponentProps> = ({ song }) => {
  const decodedImage = useMemo(
    () => song.thumbnail && DeskThing.formatImageUrl(song.thumbnail),
    [song.thumbnail]
  );

  return (
    <div>
      <h1>{song.name}</h1>
      {decodedImage && <img src={decodedImage} alt={song.name} />}
    </div>
  );
};
