import { AppSettingIDs, CONTROL_OPTIONS } from "@shared/types/discord";
import { DeafenButton } from "@src/components/controls/DeafenButton";
import { EndCallButton } from "@src/components/controls/EndCallButton";
import { MuteButton } from "@src/components/controls/MuteButton";
import { useUIStore } from "@src/stores/uiStore";

const XL_CONTROLS_ENABLED = true;
const XL_CONTROL_MIN_HEIGHT = 128;
const FALLBACK_ORDER: CONTROL_OPTIONS[] = [
  CONTROL_OPTIONS.MUTE,
  CONTROL_OPTIONS.DEAFEN,
  CONTROL_OPTIONS.DISCONNECT,
];

export const CallControlsWidget = () => {
  const dimensions = useUIStore((state) => state.dimensions);
  const order = useUIStore((state) => state.settings?.[AppSettingIDs.CONTROLS_ORDER].value);

  const controlComponents: Record<CONTROL_OPTIONS, JSX.Element> = {
    [CONTROL_OPTIONS.MUTE]: <MuteButton />,
    [CONTROL_OPTIONS.DEAFEN]: <DeafenButton />,
    [CONTROL_OPTIONS.DISCONNECT]: <EndCallButton />,
  };

  const configuredOrder: CONTROL_OPTIONS[] = Array.isArray(order)
    ? (order as CONTROL_OPTIONS[])
    : [];
  const normalizedConfiguredOrder = configuredOrder.filter(
    (control, index) =>
      FALLBACK_ORDER.includes(control) && configuredOrder.indexOf(control) === index,
  );
  const prioritizedOrder = [
    ...normalizedConfiguredOrder,
    ...FALLBACK_ORDER.filter((control) => !normalizedConfiguredOrder.includes(control)),
  ];
  const displayOrder = prioritizedOrder.length ? prioritizedOrder : FALLBACK_ORDER;

  const controlHeight = XL_CONTROLS_ENABLED
    ? Math.max(dimensions.controls.height, XL_CONTROL_MIN_HEIGHT)
    : dimensions.controls.height;

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        height: controlHeight,
        ...(XL_CONTROLS_ENABLED
          ? { minHeight: XL_CONTROL_MIN_HEIGHT }
          : { maxHeight: dimensions.controls.height }),
      }}
      className={`z-10 ${XL_CONTROLS_ENABLED ? "p-4" : "p-2"}`}
    >
      <div
        className={`flex items-center z-10 bg-neutral-900/95 h-full w-full border border-neutral-600 shadow-lg rounded-2xl ${
          XL_CONTROLS_ENABLED ? "justify-center gap-6 px-6 py-4 overflow-visible" : "justify-between space-x-5 p-1"
        }`}
      >
        {displayOrder.map((control) => (
          <div
            key={control}
            className={
              XL_CONTROLS_ENABLED
                ? "flex h-24 w-24 items-center justify-center"
                : "flex h-full w-full items-center justify-center"
            }
          >
            {controlComponents[control]}
          </div>
        ))}
      </div>
    </div>
  );
};
