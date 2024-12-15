import React, { useState } from "react";

interface ChannelBannerProps {}

const ChannelBanner: React.FC<ChannelBannerProps> = () => {
  const [channel, setChannel] = useState();

  return (
    <div className="flex items-center flex-col justify-center top-10 w-screen h-4/6 bg-white">
      You are in a channel
    </div>
  );
};

export default ChannelBanner;
