import type { CSSProperties } from "react";
import { AppSettingIDs, CONTROL_OPTIONS, CONTROL_SIZE } from "@shared/types/discord";
import { DeafenButton } from "@src/components/controls/DeafenButton";
import { EndCallButton } from "@src/components/controls/EndCallButton";
import { MuteButton } from "@src/components/controls/MuteButton";
import { useUIStore } from "@src/stores/uiStore";
import { useCallStore } from "@src/stores/callStore";
import { useInitializeCallStore } from "@src/hooks/useInitializeCallStore";
import {
  XL_CONTROL_FALLBACK_ORDER,
  XL_CONTROLS_ENABLED,
  getControlLayout,
} from "@src/constants/xlControls";

export const CallControlsWidget = () => {
  // Initialize call store once for this widget (avoid per-button init).
  useInitializeCallStore();

  // Avoid rendering controls until call state has settled; prevents render loops when
  // call status is flapping or still loading.
  const callStatus = useCallStore((state) => state.callStatus);
  const callLoading = useCallStore((state) => state.isLoading);
  const uiLoading = useUIStore((state) => state.isLoading);
  const settings = useUIStore((state) => state.settings);

  const dimensions = useUIStore((state) => state.dimensions);
  const order = useUIStore((state) => state.settings?.[AppSettingIDs.CONTROLS_ORDER].value);
  const controlSizeSetting =
    (settings?.[AppSettingIDs.CONTROLS_SIZE]?.value as CONTROL_SIZE | undefined) ??
    CONTROL_SIZE.MEDIUM;

  const controlLayout = getControlLayout(controlSizeSetting);

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
    ? Math.max(dimensions.controls.height, controlLayout.totalHeight)
    : dimensions.controls.height;

  const containerStyle: CSSProperties = XL_CONTROLS_ENABLED
    ? {
        minHeight: Math.max(
          reservedHeight -
            (controlLayout.paddingTop +
              controlLayout.paddingBottom +
              controlLayout.marginBottom),
          controlLayout.buttonSize,
        ),
        paddingTop: controlLayout.paddingTop,
        paddingBottom: controlLayout.paddingBottom,
        marginBottom: controlLayout.marginBottom,
      }
    : {
        height: reservedHeight,
        maxHeight: dimensions.controls.height,
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
      };

  const innerWrapperStyle: CSSProperties | undefined = XL_CONTROLS_ENABLED
    ? {
        ["--xl-control-button-size" as const]: `${controlLayout.buttonSize}px`,
        paddingTop: controlLayout.innerPaddingY,
        paddingBottom: controlLayout.innerPaddingY,
        columnGap: controlLayout.gap,
        rowGap: controlLayout.gap,
      }
    : undefined;

  const containerClassName = XL_CONTROLS_ENABLED
    ? "relative z-40 flex-shrink-0 w-full px-3 sm:px-4"
    : "relative z-20 p-2 mb-2";

  const innerWrapperClasses = XL_CONTROLS_ENABLED
    ? "grid grid-cols-3 w-full max-w-6xl mx-auto items-center justify-items-center px-5 sm:px-8"
    : "flex items-center justify-between space-x-5 p-1";

  // Do not render until both settings and call state are ready.
  if (
    uiLoading ||
    !settings ||
    callLoading ||
    !callStatus ||
    !callStatus.isConnected
  ) {
    return null;
  }

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
