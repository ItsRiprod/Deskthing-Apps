import { useEffect, useRef } from "react";
import { useChatStore } from "@src/stores/chatStore";
import { GuildListPanel } from "./GuildListPanel";
import { MessageStatusBox } from "@src/components/MessageStatusBox";

export const ChatPanel = () => {
  const chat = useChatStore((state) => state.chatStatus);
  const setSelectedChannelID = useChatStore((state) => state.setSelectedChannelID);

  // Ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  if (!chat || chat.messages.length === 0) return <GuildListPanel />;

  const clearSelectedChannel = () => {
    setSelectedChannelID('');
  }

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
      }}
      className="relative bg-neutral-900 overflow-hidden w-full h-full rounded-3xl flex items-end bg-cover justify-center"
    >
      {/* Absolute Back Button */}
      <button
        onClick={clearSelectedChannel}
        className="absolute top-4 left-4 flex items-center px-4 py-2 bg-neutral-800 text-white rounded-lg shadow transition hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
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
      <div
        className="flex flex-col items-start max-w-full overflow-hidden justify-start w-full h-full overflow-y-auto"
        ref={messagesEndRef}
      >
        {chat.messages.map((message, index) => (
          <MessageStatusBox key={index} message={message} />
        ))}
      </div>
    </div>
  );
};
