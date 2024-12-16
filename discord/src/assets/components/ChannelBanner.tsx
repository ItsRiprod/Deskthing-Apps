import React, { useEffect, useState } from "react";
import discordStore from "../../Stores/discordStore";
import { Channel } from "discord-rpc";

interface ChannelBannerProps {}

const ChannelBanner: React.FC<ChannelBannerProps> = () => {
  const [channel, setChannel] = useState<Channel>();

  useEffect(() => {
    // Subscribe to channel data updates
    const handleChannelUpdate = (data: Channel) => {
      setChannel(data);
    };

    const unsubscribe =
      discordStore.subscribeToChannelData(handleChannelUpdate);

    return () => {
      unsubscribe();
    };
  }, []);

  if (!channel) {
    // Do not render the banner if there is no channel data
    return null;
  }

  return (
    <div className="fixed top-0 w-full bg-gray-800 text-white p-4 shadow-md transition-transform">
      {/* Display the channel name */}
      <h2 className="text-xl font-bold">{channel.name}</h2>
    </div>
  );
};

export default ChannelBanner;
