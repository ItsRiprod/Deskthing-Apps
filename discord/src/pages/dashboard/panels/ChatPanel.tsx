import { useEffect, useRef } from "react";
import { useChatStore } from "@src/stores/chatStore";
import { GuildListPanel } from "./GuildListPanel";
import { MessageStatusBox } from "@src/components/MessageStatusBox";
import { PanelWrapper } from "./PanelWrapper";
import ObserverWrapper from "@src/components/ObserverWrapper";
import { useUIStore } from "@src/stores/uiStore";
import { AppSettingIDs } from "@shared/types/discord";

export const ChatPanel = () => {
  const chat = useChatStore((state) => state.chatStatus);
  const setSelectedChannelID = useChatStore(
    (state) => state.setSelectedChannelID
  );
  const autoscroll = useUIStore((state) => state.settings?.[AppSettingIDs.SCROLL_TO_BOTTOM].value)
  // Ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && autoscroll) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  if (!chat || chat.messages.length === 0) return <GuildListPanel />;

  const clearSelectedChannel = () => {
    setSelectedChannelID("");
  };

  return (
    <PanelWrapper>
      <div className="flex items-end w-full h-full bg-cover justify-center relative">
        {/* Persistent Back Button */}
        <button
          onClick={clearSelectedChannel}
          className="absolute top-4 left-4 flex items-center px-4 py-2 bg-neutral-800 text-white rounded-lg shadow transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
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
          <span className="ml-2 text-sm font-semibold">Back to Channels</span>
        </button>
        <div
          className="flex flex-col items-start max-w-full overflow-hidden justify-start w-full h-full overflow-y-auto"
          ref={messagesEndRef}
        >
          {chat.messages.map((message, index) => (
            <ObserverWrapper
              key={index}
              className="w-full"
              pending={
                <div className="flex min-h-12 items-start pb-4 w-full">
                  <div className="min-w-10 min-h-10 mr-1 rounded-full bg-neutral-700 animate-pulse"></div>
                  <div className="flex flex-col min-h-fit w-full">
                    <div className="w-24 h-4 bg-neutral-700 animate-pulse rounded mb-2"></div>
                    <div className="w-5/6 h-4 bg-neutral-700 animate-pulse rounded"></div>
                  </div>
                </div>
              }
            >
              <MessageStatusBox key={index} message={message} />
            </ObserverWrapper>
          ))}
        </div>
      </div>
    </PanelWrapper>
  );
};
