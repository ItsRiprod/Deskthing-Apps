import React, { useEffect, useState } from "react";
import IconRepeat from "../../svgs/Repeat";
import { useMusicStore } from "@src/stores/musicStore";

const RepeatButton: React.FC = () => {
  const [repeat, setRepeat] = useState(false);
  const [iconColor, setIconColor] = useState("white");

  const updateRepeat = useMusicStore((state) => state.repeat);
  const serverRepeat = useMusicStore((state) => state.songData?.repeat_state);
  const textColor = useMusicStore((state) => state.textColor)

  useEffect(() => {
    // update the local repeat
    setRepeat(serverRepeat != "off");
    setIconColor(serverRepeat == "off" ? textColor : "#1cd660ff");
  }, [serverRepeat]);

  const toggleRepeat = () => {
    const newRepeat = !repeat;
    setRepeat((prev) => !prev);

    setIconColor(newRepeat ? "#1cd660ff" : textColor);

    updateRepeat(newRepeat);
  };

  return (
    <button onClick={toggleRepeat} className="p-2">
      <IconRepeat color={iconColor} iconSize={45} />
    </button>
  );
};

export default RepeatButton;
