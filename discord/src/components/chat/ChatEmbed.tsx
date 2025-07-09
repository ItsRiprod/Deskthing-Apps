import { JSX } from "react";
import { Chat } from "../../pages/Chat";
import { IconX } from "../../assets/icons";
import { useChatStore } from "@src/stores/chatStore"

export function ChatEmbed(): JSX.Element {
  const isLoading = useChatStore(
    (state) => state.chatStatus?.isLoading ?? false
  );

  return isLoading ? (
    <div className="fixed bottom-4 right-4 z-50 h-[400px] w-[300px] rounded-lg bg-gray-800 shadow-xl border border-gray-700 flex items-center justify-center">
      <div className="h-full w-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
    </div>
  ) : (
    <div className="fixed bottom-4 right-4 z-50 h-[400px] w-[300px] rounded-lg bg-gray-800 shadow-xl border border-gray-700">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-700 p-3 bg-gray-900">
          <h3 className="font-semibold text-white">Chat</h3>
          <button
            className="rounded-sm p-1.5 text-gray-400 hover:bg-gray-700 transition-colors duration-200"
            aria-label="Close chat"
          >
            <IconX />
          </button>
        </div>
        <div className="grow overflow-auto bg-gray-800">
          <Chat />
        </div>
      </div>
    </div>
  );
}
