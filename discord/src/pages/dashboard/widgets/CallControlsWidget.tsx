import type { CSSProperties } from "react";
import { AppSettingIDs, CONTROL_OPTIONS } from "@shared/types/discord";
import { DeafenButton } from "@src/components/controls/DeafenButton";
import { EndCallButton } from "@src/components/controls/EndCallButton";
import { MuteButton } from "@src/components/controls/MuteButton";
import { useUIStore } from "@src/stores/uiStore";
import {
  XL_CONTROL_BUTTON_SIZE,
  XL_CONTROL_FALLBACK_ORDER,
  XL_CONTROL_MARGIN_BOTTOM,
  XL_CONTROL_MIN_HEIGHT,
  XL_CONTROL_PADDING_BOTTOM,
  XL_CONTROL_PADDING_TOP,
  XL_CONTROL_TOTAL_HEIGHT,
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

  const reservedHeight = XL_CONTROLS_ENABLED
    ? Math.max(dimensions.controls.height, XL_CONTROL_TOTAL_HEIGHT)
    : dimensions.controls.height;

  const containerStyle: CSSProperties = XL_CONTROLS_ENABLED
    ? {
        minHeight: Math.max(
          reservedHeight -
            (XL_CONTROL_PADDING_TOP +
              XL_CONTROL_PADDING_BOTTOM +
              XL_CONTROL_MARGIN_BOTTOM),
          XL_CONTROL_MIN_HEIGHT,
        ),
        paddingTop: XL_CONTROL_PADDING_TOP,
        paddingBottom: XL_CONTROL_PADDING_BOTTOM,
        marginBottom: XL_CONTROL_MARGIN_BOTTOM,
      }
    : {
        height: reservedHeight,
        maxHeight: dimensions.controls.height,
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
      };

  const innerWrapperStyle: CSSProperties | undefined = XL_CONTROLS_ENABLED
    ? { ["--xl-control-button-size" as const]: `${XL_CONTROL_BUTTON_SIZE}px` }
    : undefined;

  const containerClassName = XL_CONTROLS_ENABLED
    ? "relative z-40 flex-shrink-0 w-full px-3 sm:px-4"
    : "relative z-20 p-2 mb-2";

  const innerWrapperClasses = XL_CONTROLS_ENABLED
    ? "grid grid-cols-3 w-full max-w-6xl mx-auto items-center justify-items-center gap-14 xl:gap-20 px-5 sm:px-8 py-3"
    : "flex items-center justify-between space-x-5 p-1";

  return (
    <div style={containerStyle} className={containerClassName}>
      <div
        style={innerWrapperStyle}
        className={`z-10 bg-neutral-900/95 w-full border border-neutral-600 shadow-lg rounded-3xl overflow-visible pointer-events-auto ${innerWrapperClasses}`}
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
                    maxWidth: "var(--xl-control-button-size)",
                    maxHeight: "var(--xl-control-button-size)",
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
