import { GuildStatus } from "@shared/types/discord";
import { useChatStore } from "@src/stores/chatStore"
import { FC, useMemo } from "react";

interface GuildCardProps {
  guild: GuildStatus;
}

export const GuildCard: FC<GuildCardProps> = ({ guild }) => {
  const setSelectedGuildID = useChatStore(state => state.setSelectedGuildID);
  const guildList = useChatStore(state => state.guildList);

  const selected = useMemo(() => guildList?.selectedGuildId === guild.id, [guildList?.selectedGuildId])

  const handleGuildClick = () => {
    setSelectedGuildID(guild.id);
  };

  return (
    <div
      className={`min-w-16 min-h-16 h-16 w-16  overflow-hidden rounded-full border-2 ${
        selected ? "border-blue-500" : "border-transparent"
      }`}
    >
      <button onClick={handleGuildClick} className="w-full h-full flex items-center justify-center">
        {guild.icon ? (
          <img
            src={guild.icon}
            alt={guild.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="text-2xl bg-neutral-500 text-zinc-200 w-full h-full items-center justify-center flex font-semibold">
            {guild.name.charAt(0)}
          </p>
        )}
      </button>
    </div>
  );
};
