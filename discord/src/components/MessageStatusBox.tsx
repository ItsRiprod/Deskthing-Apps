import { DeskThing } from "@deskthing/client";
import { AppSettingIDs, ChatMessage } from "@shared/types/discord";
import { useMemo } from "react";
import { useUIStore } from "@src/stores/uiStore";

interface MessageStatusProps {
  message: ChatMessage;
}

export const MessageStatusBox = ({ message }: MessageStatusProps) => {
  const settings = useUIStore((s) => s.settings);
  const usernameFontSize =
    settings?.[AppSettingIDs.CHAT_USERNAME_FONT_SIZE]?.value ?? 17;
  const timestampFontSize =
    settings?.[AppSettingIDs.CHAT_TIMESTAMP_FONT_SIZE]?.value ?? 17;
  const messageFontSize =
    settings?.[AppSettingIDs.CHAT_MESSAGE_FONT_SIZE]?.value ?? 19;

  const profileUrl = useMemo(() => {
    if (!message.author.profileUrl) return undefined;
    return DeskThing.useProxy(message.author.profileUrl);
  }, [message.author.profileUrl]);

  const mediaUrls = useMemo(() => {
    return (message.mediaUrls || []).map((url) => DeskThing.useProxy(url));
  }, [message.mediaUrls]);

  const displayName =
    message.author.displayName ||
    (message.author as any).global_name ||
    message.author.username ||
    message.author.id ||
    "Unknown";

  const timeZone = useMemo(() => {
    if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return undefined;
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  const timestampLabel = useMemo(() => {
    const date = new Date(message.timestamp);
    if (isNaN(date.getTime())) return "";
    // Avoid Intl on low-capability devices; fall back to toLocaleTimeString.
    const opts: any = { hour: "2-digit", minute: "2-digit" };
    if (timeZone) opts.timeZone = timeZone;
    return date.toLocaleTimeString(undefined, opts);
  }, [message.timestamp, timeZone]);

  return (
    <div className="flex min-h-12 items-start pb-2 w-full">
      {profileUrl && (
        <img
          src={profileUrl}
          className="w-8 h-8 m-2 mr-4 rounded-full object-cover bg-neutral-600"
        />
      )}
      <div className="flex flex-col min-h-fit">
        <div className="flex items-baseline gap-2">
          <span
            className="font-semibold text-white"
            style={{ fontSize: `${usernameFontSize}px` }}
          >
            {displayName}
          </span>
          {timestampLabel && (
            <span
              className="text-neutral-400"
              style={{ fontSize: `${timestampFontSize}px` }}
            >
              {timestampLabel}
            </span>
          )}
        </div>
        {message.content ? (
          <span
            className="text-white break-words"
            style={{ fontSize: `${messageFontSize}px` }}
          >
            {message.content}
          </span>
        ) : null}
        {mediaUrls.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {mediaUrls.map((url, idx) => (
              <img
                key={`${message.id}-media-${idx}`}
                src={url}
                className="max-w-full rounded-lg border border-neutral-700 bg-neutral-800 object-contain"
                style={{ maxHeight: "260px" }}
                alt="attachment"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
