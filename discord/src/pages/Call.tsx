import { JSX, useEffect } from "react";
import CallTimer from "../components/call/CallTimer";
import ParticipantGrid from "../components/call/ParticipantGrid";
import { useCallStore } from "@src/stores/callStore";

export function Call(): JSX.Element {
  const callStatus = useCallStore((state) => state.callStatus);

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
      {callStatus?.participants.length === 0 ? (
        <div className="flex grow items-center justify-center">
          <p className="text-lg text-gray-500">No participants in call</p>
        </div>
      ) : (
        callStatus && <ParticipantGrid participants={callStatus.participants} />
      )}
    </div>
  );
}
