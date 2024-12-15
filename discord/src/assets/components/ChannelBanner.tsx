import React, { useEffect, useState } from "react";
import discordStore from "../../Stores/discordStore";

interface ChannelBannerProps {}

const ChannelBanner: React.FC<ChannelBannerProps> = () => {
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    // Subscribe to channel data updates
    const handleChannelUpdate = (data: any) => {
      setChannel(data);
    };

    const unsubscribe =
      discordStore.subscribeToChannelDataUpdate(handleChannelUpdate);

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
      {/* Display the channel topic if available */}
      {channel.topic && <p>{channel.topic}</p>}
    </div>
  );
};

export default ChannelBanner;
