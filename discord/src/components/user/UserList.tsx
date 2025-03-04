
import { CallParticipant } from "@shared/types/discord";
import UserCard from "./UserCard";

interface Props {
  users: CallParticipant[];
}

const UserList = ({ users }: Props) => {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};

export default UserList;
