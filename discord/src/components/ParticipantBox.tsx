import { DeskThing } from "@deskthing/client";
import { AppSettingIDs, CallParticipant } from "@shared/types/discord";
import { IconDeafenedDiscord, IconMicOffDiscord } from "@src/assets/icons";
import { useUIStore } from "@src/stores/uiStore";
import { useProfileColor } from "@src/utils/colorExtractor";
import { useMemo } from "react";

interface ParticipantBoxProps {
  participant: CallParticipant;
}

export const ParticipantBox = ({ participant }: ParticipantBoxProps) => {
  const profileUrl = useMemo(() => {
    if (!participant.profileUrl) return null;
    return DeskThing.useProxy(participant.profileUrl);
  }, [participant.profileUrl, participant.username]);
  const displayName =
    participant.displayName?.trim() ||
    participant.username ||
    participant.id;
  const activeColor = useUIStore((state) => state.settings?.[AppSettingIDs.SPEAKING_COLOR].value)

  const bgColor = useProfileColor(profileUrl)

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        backgroundColor: bgColor || "rgb(54, 57, 63)",
        borderColor: participant.isSpeaking ? activeColor : "transparent",
      }}
      className={`w-full h-full relative border-4 rounded-lg flex items-center justify-center transition-colors duration-200`}
    >
      {profileUrl && (
        <img
          src={profileUrl}
          alt={participant.username}
          style={{
            maxWidth: "80%",
            maxHeight: "80%",
            width: "70%",
            height: "70%",
          }}
          className="object-cover rounded-full"
        />
      )}
      <p
        style={{
          textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 1px 0 #000",
        }}
        className="absolute text-white bottom-2 left-2 text-ellipsis whitespace-nowrap overflow-hidden max-w-[80%] font-semibold text-sm"
      >
        {displayName}
      </p>
      <div  className="absolute flex text-white bottom-2 right-2">
        {participant.isMuted && (
          <IconMicOffDiscord className="w-4 h-4 text-red-500 fill-red-500" />
        )}
        {participant.isDeafened && (
          <IconDeafenedDiscord className="w-4 h-4 text-red-500 fill-red-500" />
        )}
      </div>
    </div>
  );
};
