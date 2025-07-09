import { JSX } from "react";
import {
  IconDeafenedDiscord,
  IconDeafenedOffDiscord,
  IconMicDiscord,
  IconMicOffDiscord,
  IconX,
} from "../assets/icons";
import { useCallStore } from "@src/stores/callStore";
import { useControlStore } from "@src/stores/controlStore";

export default function Controls(): JSX.Element {
  const isMuted = useCallStore(
    (state) => state.callStatus?.user?.isMuted ?? false
  );
  const isDeafened = useCallStore(
    (state) => state.callStatus?.user?.isDeafened ?? false
  );
  const { toggleMute, toggleDeafen, disconnect } = useControlStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center p-4">
      <div className="flex items-center space-x-4 rounded-full bg-gray-800 px-6 py-3 shadow-lg">
        {/* Mute/unmute button */}
        <button
          onClick={toggleMute}
          className={`rounded-full p-3 ${
            isMuted
              ? "bg-red-500 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <IconMicOffDiscord className="fill-current text-current" />
          ) : (
            <IconMicDiscord className="fill-current text-current" />
          )}
        </button>

        {/* Deafen/undeafen button */}
        <button
          onClick={toggleDeafen}
          className={`rounded-full p-3 ${
            isDeafened
              ? "bg-red-500 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          {isDeafened ? (
            <IconDeafenedDiscord className="fill-current text-current" />
          ) : (
            <IconDeafenedOffDiscord className="fill-current text-current" />
          )}
        </button>

        {/* Disconnect button */}
        <button
          onClick={disconnect}
          className="rounded-full bg-red-500 p-3 text-white hover:bg-red-600"
          title="Disconnect"
        >
          <IconX />
        </button>
      </div>
    </div>
  );
}
