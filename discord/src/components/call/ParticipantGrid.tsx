  import { JSX } from 'react';
  import { CallParticipant } from '@shared/types/discord';
  import UserCard from '../user/UserCard';

  interface ParticipantGridProps {
    participants: CallParticipant[];
  }

  export default function ParticipantGrid({ participants }: ParticipantGridProps): JSX.Element {
    const numParticipants = participants.length;

    return (
      <div className="grid h-full w-full grid-cols-2 gap-4 p-4 bg-gray-900">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex h-full w-full items-center justify-center"
          >
            <UserCard user={participant} />
          </div>
        ))}
      </div>
    );
  }