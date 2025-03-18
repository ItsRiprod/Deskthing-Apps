import { JSX } from "react";
import MessageItem from "../components/chat/MessageItem";
import { useAppSelector } from "../hooks/useAppSelector";

export function Chat(): JSX.Element {
  const messages = useAppSelector((state) => state.chatStatus?.messages);
  const isLoading = useAppSelector(
    (state) => state.chatStatus?.isLoading ?? false
  );

  return isLoading ? (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="h-20 w-20 border-t-4 border-blue-500 rounded-full animate-spin"></div>
    </div>
  ) : (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="grow overflow-y-auto p-4">
        {!messages || messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-300">
            No messages yet
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
