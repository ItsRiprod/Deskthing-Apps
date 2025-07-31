import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";
import { PanelWrapper } from "./PanelWrapper";
import ObserverWrapper from "@src/components/ObserverWrapper";

export const CallStatusPanel = () => {
  const callStatus = useCallStore((state) => state.callStatus);

  return (
    <PanelWrapper>
      <div className="w-full h-full">
        {callStatus && callStatus.participants.length > 0 ? (
          <div className="p-6 flex flex-wrap justify-center">
            {callStatus?.participants.map((participant) => (
              <ObserverWrapper key={participant.id} className="p-2 w-32 h-32">
                <ParticipantBox participant={participant} />
              </ObserverWrapper>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
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
    </PanelWrapper>
  );
};
