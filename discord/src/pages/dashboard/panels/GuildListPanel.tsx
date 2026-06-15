import { ChannelStatusBox } from "@src/components/ChannelStatusBox";
import { GuildStatusBox } from "@src/components/GuildStatusBox";
import { useChatStore } from "@src/stores/chatStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelWrapper } from "./PanelWrapper";
import ObserverWrapper from "@src/components/ObserverWrapper";

export const GuildListPanel = () => {
  const guildList = useChatStore((state) => state.guildList);
  const selectedGuild = useChatStore((state) => state.selectedGuildId);
  const fetchGuildList = useChatStore((state) => state.getGuildList);
  const channels = useChatStore((state) => state.channels);
  const clearSelectedGuild = useChatStore((state) => state.clearSelectedGuild);
  const isLoading = useChatStore((state) => state.isLoading);
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(false);
  const loadingPromptTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedGuildName = useMemo(() => {
    const guild = guildList?.guilds.find((g) => g.id === selectedGuild);
    return guild ? guild.name : "Select a Guild";
  }, [guildList, selectedGuild]);

  const resetLoadingPromptTimeout = useCallback(() => {
    setLoadingPrompt(false);

    if (loadingPromptTimeout.current) {
      clearTimeout(loadingPromptTimeout.current);
    }

    loadingPromptTimeout.current = setTimeout(() => {
      setLoadingPrompt(true);
    }, 5000);
  }, []);

  useEffect(() => {
    if (isLoading) {
      resetLoadingPromptTimeout();
    } else {
      setLoadingPrompt(false);
      if (loadingPromptTimeout.current) {
        clearTimeout(loadingPromptTimeout.current);
        loadingPromptTimeout.current = null;
      }
    }

    return () => {
      if (loadingPromptTimeout.current) {
        clearTimeout(loadingPromptTimeout.current);
        loadingPromptTimeout.current = null;
      }
    };
  }, [isLoading, resetLoadingPromptTimeout]);

  const handleFetchGuildList = async () => {
    try {
      resetLoadingPromptTimeout();
      await fetchGuildList();
    } catch (error) {
      console.error("Failed to fetch guild list:", error);
    }
  };

  const clearGuildSelection = () => {
    clearSelectedGuild();
  };

  return (
    <PanelWrapper>
      <div className="w-full flex justify-center max-h-full">
        {channels && channels.length > 0 ? (
          <div className="flex w-full flex-grow pt-12">
            <div className="absolute top-0 left-0 w-full flex items-center px-6 py-3 bg-neutral-800 rounded-t-3xl shadow z-10">
              <button
                onClick={clearGuildSelection}
                className="flex items-center px-4 py-2 bg-neutral-700 text-white rounded-lg shadow transition hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-400 mr-4"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
              <p className="text-neutral-200 text-lg font-semibold">
                {selectedGuildName}
              </p>
            </div>
            <div className="flex flex-col w-full items-start justify-start overflow-y-auto">
              {channels.map((channel) => (
                <ObserverWrapper
                  key={channel.id}
                  className="p-2 w-full"
                  pending={
                    <div className="h-5 animate-pulse bg-zinc-500 rounded-lg" />
                  }
                >
                  <ChannelStatusBox channel={channel} />
                </ObserverWrapper>
              ))}
            </div>
          </div>
        ) : guildList?.guilds && guildList?.guilds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full h-full overflow-y-auto">
            {guildList.guilds.map((guild) => (
              <ObserverWrapper
                key={guild.id}
                className="p-2"
                pending={
                  <div className="min-h-36 min-w-36 animate-pulse bg-zinc-500 rounded-lg" />
                }
              >
                <GuildStatusBox guild={guild} />
              </ObserverWrapper>
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
                {loadingPrompt && (
                  <div>
                    <button
                      onClick={handleFetchGuildList}
                      className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Manually Refresh Guild List
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-neutral-400 text-lg mb-4">
                  No guilds loaded
                </p>
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
    </PanelWrapper>
  );
};
