import { ChannelStatus } from "@shared/types/discord";
import { useChatStore } from "@src/stores/chatStore";

interface ChannelBoxProps {
  channel: ChannelStatus;
}

// Simple SVG icons for demonstration
const ChannelTypeIcon = ({ type }: { type: number }) => {
  switch (type) {
    case 0: // GUILD_TEXT
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <rect x="3" y="6" width="14" height="2" rx="1" fill="#b9bbbe" />
          <rect x="3" y="10" width="10" height="2" rx="1" fill="#b9bbbe" />
        </svg>
      );
    case 1: // DM
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <circle cx="10" cy="10" r="8" stroke="#b9bbbe" strokeWidth="2" fill="none" />
          <circle cx="10" cy="10" r="4" fill="#b9bbbe" />
        </svg>
      );
    case 2: // GUILD_VOICE
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <rect x="7" y="5" width="6" height="10" rx="3" fill="#b9bbbe" />
          <rect x="13" y="8" width="2" height="4" rx="1" fill="#b9bbbe" />
        </svg>
      );
    case 3: // GROUP_DM
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <circle cx="7" cy="10" r="3" fill="#b9bbbe" />
          <circle cx="13" cy="10" r="3" fill="#b9bbbe" />
        </svg>
      );
    case 4: // GUILD_CATEGORY
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <rect x="4" y="7" width="12" height="6" rx="2" fill="#b9bbbe" />
        </svg>
      );
    case 5: // GUILD_ANNOUNCEMENT
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <polygon points="5,7 15,10 5,13" fill="#b9bbbe" />
        </svg>
      );
    case 6: // GUILD_STORE
      return (
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="mr-2">
          <rect x="5" y="7" width="10" height="6" rx="2" fill="#b9bbbe" />
          <rect x="7" y="9" width="6" height="2" rx="1" fill="#23272a" />
        </svg>
      );
    default:
      return null;
  }
};

export const ChannelStatusBox = ({ channel }: ChannelBoxProps) => {
  const selectChannel = useChatStore((state) => state.setSelectedChannelID);

  const selectedChannelId = useChatStore((state) => state.selectedChannelId);

  return (
    <button
      onClick={() => selectChannel(channel.id)}
      className={`w-full h-full py-2 relative rounded-lg flex ${selectedChannelId === channel.id ? "bg-neutral-500/50" : "bg-transparent"}`}
    >
      <ChannelTypeIcon type={channel.type} />
      <p className="text-white font-semibold text-sm">{channel.name}</p>
    </button>
  );
};
