import { ChannelStatusBox } from "@src/components/ChannelStatusBox";
import { GuildStatusBox } from "@src/components/GuildStatusBox";
import { useChatStore } from "@src/stores/chatStore";

export const GuildListPanel = () => {
  const guildList = useChatStore((state) => state.guildList);
  const fetchGuildList = useChatStore((state) => state.getGuildList);
  const channels = useChatStore((state) => state.channels);
  const clearSelectedGuild = useChatStore((state) => state.clearSelectedGuild);
  const isLoading = useChatStore((state) => state.isLoading);

  const handleFetchGuildList = async () => {
    try {
      await fetchGuildList();
    } catch (error) {
      console.error("Failed to fetch guild list:", error);
    }
  };

  const clearGuildSelection = () => {
    clearSelectedGuild();
  };

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
      }}
      className="w-full items-center justify-center h-full bg-neutral-700 rounded-3xl p-6"
    >
      {channels && channels.length > 0 ? (
        <div className="flex w-full h-full">
          <div>
            <button
              onClick={clearGuildSelection}
              className="flex items-center gap-2 mt-2 px-4 py-2 bg-neutral-800 text-white rounded-lg shadow transition hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Guilds</span>
            </button>
          </div>
          <div className="flex flex-col items-start justify-start h-full w-full overflow-y-auto">
            {channels.map((channel) => (
              <ChannelStatusBox key={channel.id} channel={channel} />
            ))}
          </div>
        </div>
      ) : guildList?.guilds && guildList?.guilds.length > 0 ? (
        <div className="overflow-y-auto grid grid-cols-2 w-full h-full">
          {guildList.guilds.map((guild) => (
            <div key={guild.id} className="p-2 h-full w-full">
              <GuildStatusBox guild={guild} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full py-8">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-400 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              <p className="text-neutral-300 text-lg font-medium">
                Loading guilds...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-neutral-400 text-lg mb-4">No guilds loaded</p>
              <button
                onClick={handleFetchGuildList}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Fetch Guild List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
