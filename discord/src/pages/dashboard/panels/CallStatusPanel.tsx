import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";

export const CallStatusPanel = () => {
  const callStatus = useCallStore((state) => state.callStatus);

  // Calculate grid columns based on number of participants (max 4 columns)
  const participantCount = callStatus?.participants.length || 0;
  const columns = participantCount <= 1 ? 1 : participantCount === 2 ? 2 : participantCount <= 4 ? 2 : participantCount <= 6 ? 3 : 4;

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "1rem",
      }}
      className="w-full h-full bg-neutral-700 rounded-3xl p-6"
    >
      {callStatus?.participants.map((participant) => (
        <ParticipantBox
          key={participant.id}
          participant={participant}
        />
      ))}
    </div>
  );
};
