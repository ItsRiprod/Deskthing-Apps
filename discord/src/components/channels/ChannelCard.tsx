import { ChannelStatus } from "@shared/types/discord";
import { useChatStore } from "@src/stores/chatStore"
import { FC, useEffect } from "react";

interface ChannelCardProps {
  channel: ChannelStatus;
  selected?: boolean;
}

export const ChannelCard: FC<ChannelCardProps> = ({ channel }) => {
  const setSelectedChannelID = useChatStore(state => state.setSelectedChannelID);
  const isSelected = useChatStore(
    (state) => state.chatStatus?.currentChannelId == channel.id
  );

  const handleClick = () => {
    setSelectedChannelID(channel.id);
  };

  return (
    <div
      className={`flex items-center px-5 py-2 bg-neutral-600 rounded-lg border-2 hover:border-blue-500 transition-colors ${
        isSelected ? "border-blue-500" : "border-transparent"
      }`}
    >
      <button onClick={handleClick} className="w-full h-full">
        <div className="font-medium text-zinc-200">{channel.name}</div>
      </button>
    </div>
  );
};
