import { DeskThing } from "@deskthing/client";
import { GuildStatus } from "@shared/types/discord";
import { useChatStore } from "@src/stores/chatStore";
import { useProfileColor } from "@src/utils/colorExtractor";
import { useMemo } from "react";

interface GuildStatusProps {
  guild: GuildStatus;
}

export const GuildStatusBox = ({ guild }: GuildStatusProps) => {
  const guildUrl = useMemo(() => {
    if (!guild.icon) return null;
    return DeskThing.useProxy(guild.icon);
  }, [guild.icon]);

  const selectGuild = useChatStore((state) => state.setSelectedGuildID)
  const selectedGuildId = useChatStore((state) => state.selectedGuildId)

  const bgColor = useProfileColor(guildUrl);

  return (
    <button
      onClick={() => selectGuild(guild.id)}
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        backgroundColor: bgColor || "rgb(54, 57, 63)",
      }}
      className={`w-full h-full relative rounded-lg flex items-center justify-center border-4 ${selectedGuildId === guild.id ? "border-blue-500" : "border-transparent"}`}
    >
      {guildUrl ? (
        <div className="flex items-center justify-center flex-col">
          <img
            src={guildUrl}
            alt={guild.name}
            className="h-3/5 object-cover rounded-full"
          />
          <p className="text-white font-semibold text-sm">{guild.name}</p>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <p className="text-white font-semibold text-sm">{guild.name}</p>
        </div>
      )}
    </button>
  );
};
