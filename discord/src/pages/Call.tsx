import { JSX, useEffect } from 'react';
import { useCallStatus } from '../hooks/useCallStatus';
import { useDiscordActions } from '../hooks/useDiscordActions';
import CallTimer from '../components/call/CallTimer';
import ParticipantGrid from '../components/call/ParticipantGrid';

export function Call(): JSX.Element {
  const {
    participants,
    callStatus
  } = useCallStatus();

  const {  } = useDiscordActions();

  // Effect to handle cleanup when component unmounts or call ends
  useEffect(() => {
    return () => {
      // Any cleanup needed when leaving call view
    };
  }, []);

  // Call view focuses on participants and their status
  return (
    <div className="flex h-full flex-col">
      {callStatus?.timestamp && <CallTimer startTime={callStatus.timestamp} />}
      {participants.length === 0 ? (
        <div className="flex flex-grow items-center justify-center">
          <p className="text-lg text-gray-500">No participants in call</p>
        </div>
      ) : (
        <ParticipantGrid participants={participants} />
      )}
    </div>
  );
}