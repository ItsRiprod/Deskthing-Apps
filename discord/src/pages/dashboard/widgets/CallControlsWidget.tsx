import { DeafenButton } from "@src/components/controls/DeafenButton";
import { EndCallButton } from "@src/components/controls/EndCallButton";
import { MuteButton } from "@src/components/controls/MuteButton";

export const CallControlsWidget = () => {
  return (
    <div className="w-full flex items-center justify-center space-x-5 mt-2 bg-neutral-500/75 rounded-xl py-2 h-14 drop-shadow-lg shadow-">
      <DeafenButton />
      <MuteButton />
      <EndCallButton />
    </div>
  );
};
