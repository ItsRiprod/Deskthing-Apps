import { CallParticipant } from "@shared/types/discord";
import SpeakingIndicator from "../call/SpeakingIndicator";
import { IconDeafenedDiscord, IconMicOffDiscord } from "../../assets/icons"

interface Props {
  user: CallParticipant;
}

const UserCard = ({ user }: Props) => {
  return (
    <div className="max-w-full w-full min-h-fit h-full overflow-x-auto flex items-center gap-2 p-3 rounded-lg bg-gray-800">
      <SpeakingIndicator user={user} />
      <span className="text-white text-sm font-medium">{user.username}</span>
      {user.isMuted && (
        <IconMicOffDiscord className="text-red-500 fill-red-500" />
      )}
      {user.isDeafened && (
        <IconDeafenedDiscord className="text-red-500 fill-red-500" />
      )}
    </div>
  );
};

export default UserCard;
