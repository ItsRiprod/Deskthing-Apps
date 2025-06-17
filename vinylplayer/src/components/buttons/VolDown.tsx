import React from "react";
import IconVolumeDown from "../../svgs/VolumeDown";
import { useMusicStore } from "../../stores/musicStore";

const VolDown: React.FC = () => {
  const volumeDown = useMusicStore((state) => state.volumeDown);
  const textColor = useMusicStore((state) => state.textColor);

  return (
    <button onClick={volumeDown} className="rounded-full p-2">
      <IconVolumeDown color={textColor} iconSize={50} />
    </button>
  );
};

export default VolDown;