import React, { useState } from "react";
import {
  IconCallDiscord,
  IconDeafenedDiscord,
  IconDeafenedOffDiscord,
  IconMicDiscord,
  IconMicOffDiscord,
} from "../icons";
import { DeskThing } from "deskthing-client";

interface ControlsProps {}

const Controls: React.FC<ControlsProps> = () => {
  const deskthing = DeskThing.getInstance();
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  // Toggle microphone mute/unmute
  const handleMic = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    deskthing.send({
      type: "set",
      request: "mic",
      payload: newMutedState,
    });
  };

  // Toggle deafened state
  const handleDeaf = () => {
    const newDeafenedState = !deafened;
    setDeafened(newDeafenedState);
    deskthing.send({
      type: "set",
      request: "deafened",
      payload: newDeafenedState,
    });
  };

  // End the current call
  const handleEnd = () => {
    deskthing.send({
      type: "set",
      request: "call",
      payload: false,
    });
  };

  return (
    <div className="fixed bottom-0 w-full bg-gray-800">
      <div className="flex py-3 justify-evenly">
        {/* Deafened Button */}
        <button onClick={handleDeaf}>
          {deafened ? (
            <IconDeafenedDiscord
              iconSize={60} // Increased icon size
              className="fill-current text-red-700"
            />
          ) : (
            <IconDeafenedOffDiscord
              iconSize={60} // Increased icon size
              className="fill-current text-green-500"
            />
          )}
        </button>
        {/* Mute/Unmute Button */}
        <button onClick={handleMic}>
          {muted ? (
            <IconMicOffDiscord
              iconSize={60} // Increased icon size
              className="fill-current text-red-500"
            />
          ) : (
            <IconMicDiscord
              iconSize={60} // Increased icon size
              className="fill-current text-green-500"
            />
          )}
        </button>
        {/* End Call Button */}
        <button onClick={handleEnd}>
          <IconCallDiscord
            iconSize={60} // Increased icon size
            className="fill-current text-red-700"
          />
        </button>
      </div>
    </div>
  );
};

export default Controls;
