  import { CallParticipant } from "@shared/types/discord";
  import Avatar from "../common/Avatar";

  interface Props {
    user: CallParticipant;
  }

  const UserAvatar = ({ user }: Props) => {
    return (
      <Avatar
        src={user.profileUrl || ''}
        alt={user.username}
      />
    );
  };

  export default UserAvatar;