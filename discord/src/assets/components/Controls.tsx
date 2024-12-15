import React, { useEffect, useRef, useState } from "react";
import {
  IconCallDiscord,
  IconDeafenedDiscord,
  IconDeafenedOffDiscord,
  IconMicDiscord,
  IconMicOffDiscord,
} from "../icons";
import { DeskThing } from "deskthing-client";

interface ControlsProps {
  // Define your props here
}

const Controls: React.FC<ControlsProps> = () => {
  const deskthing = DeskThing.getInstance();
  const discordIslandRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  const handleMic = () => {
    setMuted((old) => !old);
    deskthing.send({
      type: "set",
      request: "mic",
      payload: !muted,
    });
  };
  const handleDeaf = () => {
    setDeafened((old) => !old);
    deskthing.send({
      type: "set",
      request: "deafened",
      payload: !deafened,
    });
  };
  const handleEnd = () => {
    deskthing.send({
      type: "set",
      request: "call",
      payload: false,
    });
  };
  return (
    <div
      className={`fixed border-2 rounded-full top-10 left-10 overflow-hidden bg-black transition-all duration-300 "w-72" : "w-16"
      `}
      ref={discordIslandRef}
    >
      <div className="flex py-3 flex-nowrap justify-evenly">
        <button onClick={handleDeaf}>
          {deafened ? (
            <IconDeafenedDiscord
              iconSize={60}
              className={"fill-current text-red-700"}
            />
          ) : (
            <IconDeafenedOffDiscord
              iconSize={60}
              className={"fill-current stroke-current text-indigo-900"}
            />
          )}
        </button>
        <button onClick={handleMic}>
          {muted ? (
            <IconMicOffDiscord
              iconSize={60}
              className={"fill-current stroke-current text-red-500"}
            />
          ) : (
            <IconMicDiscord
              iconSize={60}
              className={"fill-current stroke-current text-indigo-900"}
            />
          )}
        </button>
        <button onClick={handleEnd}>
          <IconCallDiscord
            iconSize={60}
            className={"fill-current stroke-current text-red-700"}
          />
        </button>
      </div>
    </div>
  );
};

export default Controls;
