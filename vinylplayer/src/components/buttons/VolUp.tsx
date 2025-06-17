import React from "react";
import IconVolumeUp from "../../svgs/VolumeUp";
import { useMusicStore } from "../../stores/musicStore";

const VolUp: React.FC = () => {
  const volumeUp = useMusicStore((state) => state.volumeUp);
  const textColor = useMusicStore((state) => state.textColor);

  return (  
    <button onClick={volumeUp} className="rounded-full p-2">
      <IconVolumeUp color={textColor} iconSize={50} />
    </button>
  );
};

export default VolUp;