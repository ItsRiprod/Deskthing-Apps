import React from "react";
import IconPlay from "../../svgs/Play";
import IconPause from "../../svgs/Pause";
import { useMusicStore } from "../../stores/musicStore";

const PlayPause: React.FC = () => {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const playPause = useMusicStore((state) => state.playPause);
  const textColor = useMusicStore((state) => state.textColor);
  const color = useMusicStore((state) => state.color);

  const bgColor = color.isLight ? "white" : "black";

  return (
    <button onClick={playPause} className="rounded-full p-2">
      {isPlaying ? (
        <IconPause stroke={bgColor} fill={bgColor} color={textColor} iconSize={75} />
      ) : (
        <IconPlay stroke={bgColor} fill={bgColor} color={textColor} iconSize={75} />
      )}
    </button>
  );
};

export default PlayPause;
