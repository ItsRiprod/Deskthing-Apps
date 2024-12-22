import React, { useState } from "react";
import { DeskThing } from "deskthing-client";
import { UserData } from "../types/discord";

interface UserDetailPanelProps {
  user: UserData;
  onBack: () => void;
}

const UserDetailPanel: React.FC<UserDetailPanelProps> = ({ user, onBack }) => {
  const deskthing = DeskThing.getInstance();
  const [tempVolume, setTempVolume] = useState(user.volume ?? 100);
  const [tempMute, setTempMute] = useState(user.mute ?? false);

  const handleSetVolume = (newVolume: number) => {
    setTempVolume(newVolume);
    // Send new volume to server
    deskthing.send({
      app: "discord",
      type: "set",
      request: "user_voice_state",
      payload: { user_id: user.user_id, volume: newVolume },
    });
  };

  const handleSetMute = () => {
    const newMute = !tempMute;
    setTempMute(newMute);
    deskthing.send({
      app: "discord",
      type: "set",
      request: "user_voice_state",
      payload: { user_id: user.user_id, mute: newMute },
    });
  };

  return (
    <div className="flex flex-col p-4 bg-gray-900 text-white h-full w-full">
      <button
        className="mt-16 mb-4 text-blue-400 hover:underline"
        onClick={onBack}
      >
        &larr; Back
      </button>
      <div className="flex flex-col items-center mb-6">
        {/* User Profile */}
        {user.profile ? (
          <img
            src={user.profile}
            className="w-32 h-32 rounded-full mb-4"
            alt="User Profile"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-600 mb-4" />
        )}
        {/* Username or Nick */}
        <h2 className="text-xl font-bold">
          {user.nick || user.username || "Unknown User"}
        </h2>
      </div>
      {/* Voice Settings */}
      <div className="flex flex-col gap-4">
        {/* Volume Control */}
        <div>
          <label className="mr-2">Volume:</label>
          <input
            type="range"
            min={0}
            max={200}
            value={tempVolume}
            onChange={(e) => handleSetVolume(Number(e.target.value))}
          />
          <span className="ml-2">{tempVolume}</span>
        </div>
        {/* Mute Toggle */}
        <button
          onClick={handleSetMute}
          className={`p-2 rounded ${tempMute ? "bg-red-600" : "bg-green-600"}`}
        >
          {tempMute ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
};

export default UserDetailPanel;
