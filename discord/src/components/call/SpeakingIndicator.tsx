
import { CallParticipant } from "@shared/types/discord";
import UserAvatar from "../user/UserAvatar";

interface Props {
  user: CallParticipant;
}

const SpeakingIndicator = ({ user }: Props) => {
  return (
    <div className="relative shrink-0">
      <UserAvatar user={user} />
      {user.isSpeaking && (
        <div className="absolute -inset-1 rounded-full border-2 border-green-500 animate-pulse" />
      )}
    </div>
  );
};

export default SpeakingIndicator;
