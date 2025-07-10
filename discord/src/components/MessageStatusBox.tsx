import { DeskThing } from "@deskthing/client";
import { ChatMessage } from "@shared/types/discord";
import { useMemo } from "react";

interface MessageStatusProps {
  message: ChatMessage;
}

export const MessageStatusBox = ({ message }: MessageStatusProps) => {
  const profileUrl = useMemo(() => {
    if (!message.author.profileUrl) return undefined;
    return DeskThing.useProxy(message.author.profileUrl);
  }, [message.author.profileUrl]);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg mb-2 w-full max-w-md bg-neutral-800 shadow">
      {profileUrl && (
        <img
          src={profileUrl}
          className="w-8 h-8 rounded-full object-cover bg-neutral-600"
        />
      )}
      <div className="flex flex-col">
        <span className="font-semibold text-white">
          {message.author.username}
        </span>
        <span className="text-white break-words">{message.content}</span>
      </div>
    </div>
  );
};
