import { FC, JSX, useEffect } from "react";
import { Chat } from "../pages/Chat";
import { useAppState } from "../hooks/useAppState"
import { GuildCard } from "@src/components/guild/GuildCard";
import { ChannelCard } from "@src/components/channels/ChannelCard";
import { useAppSelector } from "@src/hooks/useAppSelector"

interface GuildLayoutProps {}

export const GuildLayout: FC<GuildLayoutProps> = (): JSX.Element => {
  const { getGuildList } = useAppState()

  const guilds = useAppSelector((state) => state.guildList?.guilds)
  const channels = useAppSelector((state) => state.guildList?.textChannels)

  const handleGuildRefresh = () => {
    getGuildList()
  }

  return (
    <div className={"h-full w-full overflow-hidden bg-gray-800"}>
      <div className="flex h-full">
        <div className="w-20 bg-gray-900 flex flex-col p-1 gap-3 overflow-y-auto">
          {(guilds && guilds.length > 0) ? guilds.map(guild => (
            <GuildCard key={guild.id} guild={guild} />
          )) : (
            <button onClick={handleGuildRefresh} className="bg-red-500">
                Refresh guild list
            </button>
          )}
        </div>
        <div className="w-60 bg-gray-800 p-3 flex flex-col gap-3 overflow-y-auto">
          {channels?.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-700 p-3 bg-gray-900">
            <h3 className="font-semibold text-white">Chat</h3>
          </div>

          {/* Main chat content */}
          <div className="flex-grow overflow-auto bg-gray-800">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
};