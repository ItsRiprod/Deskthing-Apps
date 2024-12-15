import React from "react";

interface ChannelBannerProps {
  message?: string;
}

const ChannelBanner: React.FC<ChannelBannerProps> = () => {
  return (
    <div className="flex items-center flex-col justify-center w-screen h-1/6">
      You are in a channel
    </div>
  );
};

export default ChannelBanner;
