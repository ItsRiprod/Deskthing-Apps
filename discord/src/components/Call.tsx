import Controls from "./Controls";
import discordStore from "../Stores/discordStore";
import { useEffect, useState } from "react";
import {
  IconDeafenedDiscord,
  IconMicOffDiscord,
  IconUserCircle,
} from "../assets/icons";
import ChannelBanner from "./ChannelBanner";
// import UserDetailPanel from "./UserDetailPanel";
import { UserData } from "../types/discord";

export const Call = () => {
  const [callData, setCallData] = useState<UserData[]>(
    discordStore.getCallData()
  );
  // const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const handleCallDataUpdate = (data: UserData[]) => {
    setCallData(data);
  };

  // const handleSelectUser = (user: UserData) => {
  //   setSelectedUser(user);
  // };

  useEffect(() => {
    // Request initial call data

    const unsubscribe = discordStore.subscribeToCallData(handleCallDataUpdate);
    discordStore.requestCallData();

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper function to create a volume border based on user's volume
  const getVolumeBorder = (volume: number) => {
    const degree = (volume / 200) * 360;
    return `conic-gradient(indigo ${degree}deg, transparent ${degree}deg)`;
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-900 text-white">
      {/* Channel information banner */}
      <ChannelBanner />
      {/* Participants display area */}
      {/* {selectedUser ? (
        <UserDetailPanel
          user={selectedUser}
          onBack={() => setSelectedUser(null)}
        />
      ) : ( */}
      <div className="flex-1 flex flex-wrap justify-center items-center p-4 overflow-y-auto">
        {callData && callData.length > 0 ? (
          callData.map((participant) => (
            <div
              key={participant.id}
              className="flex flex-col items-center m-3"
              // onClick={() => handleSelectUser(participant)}
            >
              {participant.username ? (
                <div className="relative w-40 h-40">
                  {/* Participant's avatar with speaking indication */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-full ${
                      participant.speaking
                        ? "border-4 border-green-500"
                        : "border-transparent p-1"
                    }`}
                    style={{
                      background: getVolumeBorder(participant.volume ?? 0),
                    }}
                  >
                    <div
                      className="inset-0 w-full h-full overflow-hidden rounded-full"
                      style={{
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        background: `url(${participant.profile})`,
                      }}
                    />
                  </div>
                  {/* Mute and deafened indicators */}
                  <div className="absolute right-0 bottom-0 text-red-500 fill-current">
                    {participant.mute && <IconMicOffDiscord />}
                    {participant.deaf && <IconDeafenedDiscord />}
                  </div>
                </div>
              ) : (
                // Default icon if no profile picture
                <IconUserCircle
                  iconSize={280}
                  className="bg-green-500 w-40 h-40 rounded-full"
                />
              )}
              <div className="user-info">
                {/* Display user's nickname or username */}
                <h2 className="font-semibold">
                  {participant.nick || participant.username}
                </h2>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No participants in the call.</p>
        )}
      </div>
      {/* )} */}
      {/* Controls component */}
      <Controls />
    </div>
  );
};
