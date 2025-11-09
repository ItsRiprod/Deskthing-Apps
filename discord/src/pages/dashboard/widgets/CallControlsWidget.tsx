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

  const containerClassName = XL_CONTROLS_ENABLED
    ? "relative z-40 px-6 pt-6 pb-4 mb-8"
    : "relative z-20 p-2 mb-2";

  const innerWrapperClasses = XL_CONTROLS_ENABLED
    ? "grid w-full h-full max-w-6xl mx-auto grid-cols-3 items-center justify-items-center gap-12 sm:gap-16 lg:gap-20 px-6 sm:px-10 py-6"
    : "flex items-center justify-between space-x-5 p-1";

  return (
    <div style={containerStyle} className={containerClassName}>
      <div
        style={innerWrapperStyle}
        className={`z-10 bg-neutral-900/95 h-full w-full border border-neutral-600 shadow-lg rounded-2xl overflow-visible pointer-events-auto ${innerWrapperClasses}`}
      >
        {displayOrder.map((control) => (
          <div
            key={control}
            className={
              XL_CONTROLS_ENABLED
                ? "flex items-center justify-center pointer-events-auto"
                : "flex h-full w-full items-center justify-center"
            }
            style={
              XL_CONTROLS_ENABLED
                ? {
                    width: "var(--xl-control-button-size)",
                    height: "var(--xl-control-button-size)",
                    maxWidth: "100%",
                    maxHeight: "100%",
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
