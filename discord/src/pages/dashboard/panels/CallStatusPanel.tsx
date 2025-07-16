import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";

export const CallStatusPanel = () => {
  const callStatus = useCallStore((state) => state.callStatus);

  // Calculate grid columns based on number of participants (max 4 columns)
  const participantCount = callStatus?.participants.length || 0;
  const columns =
    participantCount <= 1
      ? 1
      : participantCount === 2
      ? 2
      : participantCount <= 4
      ? 2
      : participantCount <= 6
      ? 3
      : 4;

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
      className="w-full h-full bg-neutral-700 rounded-3xl"
    >
      {callStatus && callStatus.participants.length > 0 ? (
        <div className="p-6">
          {callStatus?.participants.map((participant) => (
            <ParticipantBox key={participant.id} participant={participant} />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 rounded-2xl border-2 border-neutral-600 shadow-lg">
          <svg
            width="48"
            height="48"
            fill="none"
            viewBox="0 0 24 24"
            className="mb-4 text-neutral-400"
          >
            <path
              d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.582-5-8-5z"
              fill="currentColor"
            />
          </svg>
          <div className="text-lg font-semibold text-neutral-200 mb-1">
            No participants in call
          </div>
          <div className="text-sm text-neutral-400">
            Invite others to join and start collaborating!
          </div>
        </div>
      )}
    </div>
  );
};
