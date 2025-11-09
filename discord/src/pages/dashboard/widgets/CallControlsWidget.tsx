import type { CSSProperties } from "react";
import { AppSettingIDs, CONTROL_OPTIONS } from "@shared/types/discord";
import { DeafenButton } from "@src/components/controls/DeafenButton";
import { EndCallButton } from "@src/components/controls/EndCallButton";
import { MuteButton } from "@src/components/controls/MuteButton";
import { useUIStore } from "@src/stores/uiStore";
import {
  XL_CONTROL_BUTTON_SIZE,
  XL_CONTROL_FALLBACK_ORDER,
  XL_CONTROL_MIN_HEIGHT,
  XL_CONTROLS_ENABLED,
} from "@src/constants/xlControls";

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
      XL_CONTROL_FALLBACK_ORDER.includes(control) &&
      configuredOrder.indexOf(control) === index,
  );
  const prioritizedOrder = [
    ...normalizedConfiguredOrder,
    ...XL_CONTROL_FALLBACK_ORDER.filter(
      (control) => !normalizedConfiguredOrder.includes(control),
    ),
  ];
  const displayOrder = prioritizedOrder.length ? prioritizedOrder : XL_CONTROL_FALLBACK_ORDER;

  const controlHeight = XL_CONTROLS_ENABLED
    ? Math.max(dimensions.controls.height, XL_CONTROL_MIN_HEIGHT)
    : dimensions.controls.height;

  const containerStyle: CSSProperties = XL_CONTROLS_ENABLED
    ? {
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        minHeight: controlHeight,
        height: controlHeight,
      }
    : {
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        height: controlHeight,
        maxHeight: dimensions.controls.height,
      };

  const innerWrapperStyle: CSSProperties | undefined = XL_CONTROLS_ENABLED
    ? { ["--xl-control-button-size" as const]: `${XL_CONTROL_BUTTON_SIZE}px` }
    : undefined;

  return (
    <div
      style={containerStyle}
      className={`relative ${XL_CONTROLS_ENABLED ? "z-30 px-6 pt-6 pb-4" : "z-10 p-2"}`}
    >
      <div
        style={innerWrapperStyle}
        className={`flex items-center z-10 bg-neutral-900/95 h-full w-full border border-neutral-600 shadow-lg rounded-2xl overflow-visible pointer-events-auto ${
          XL_CONTROLS_ENABLED
            ? "justify-evenly gap-20 px-10 sm:px-16 md:px-24 py-6 max-w-5xl mx-auto"
            : "justify-between space-x-5 p-1"
        }`}
      >
        {displayOrder.map((control) => (
          <div
            key={control}
            className={
              XL_CONTROLS_ENABLED
                ? "flex items-center justify-center shrink-0"
                : "flex h-full w-full items-center justify-center"
            }
            style={
              XL_CONTROLS_ENABLED
                ? {
                    width: "var(--xl-control-button-size)",
                    height: "var(--xl-control-button-size)",
                  }
                : undefined
            }
          >
            {controlComponents[control]}
          </div>
        ))}
      </div>
    </div>
  );
};
