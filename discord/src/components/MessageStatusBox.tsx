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
    <div className="flex min-h-12 items-start pb-2 w-full">
      {profileUrl && (
        <img
          src={profileUrl}
          className="w-8 h-8 m-2 mr-4 rounded-full object-cover bg-neutral-600"
        />
      )}
      <div className="flex flex-col min-h-fit">
        <span className="font-semibold text-white">
          {message.author.username}
        </span>
        <span className="text-white break-words">{message.content}</span>
      </div>
    </div>
  );
};
