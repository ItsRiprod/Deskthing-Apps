import { AppSettingIDs, CONTROL_OPTIONS } from "@shared/types/discord";
import { DeafenButton } from "@src/components/controls/DeafenButton";
import { EndCallButton } from "@src/components/controls/EndCallButton";
import { MuteButton } from "@src/components/controls/MuteButton";
import { useUIStore } from "@src/stores/uiStore";

export const CallControlsWidget = () => {
  const dimensions = useUIStore((state) => state.dimensions);
  const order = useUIStore((state) => state.settings?.[AppSettingIDs.CONTROLS_ORDER].value);

  const controlComponents: Record<string, JSX.Element> = {
    [CONTROL_OPTIONS.DEAFEN]: <DeafenButton key="deafen" />,
    [CONTROL_OPTIONS.MUTE]: <MuteButton key="mute" />,
    [CONTROL_OPTIONS.DISCONNECT]: <EndCallButton key="disconnect" />,
  };

  return (
    <div
      style={{
        maxHeight: dimensions.controls.height,
        height: dimensions.controls.height,
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
      }}
      className="z-10 p-2"
    >
      <div className="flex items-center p-1 z-10 justify-between space-x-5 bg-neutral-900/95 rounded-xl h-full w-full border border-neutral-600 shadow-lg">
        {order?.map((control) => controlComponents[control])}
      </div>
    </div>
  );
};
