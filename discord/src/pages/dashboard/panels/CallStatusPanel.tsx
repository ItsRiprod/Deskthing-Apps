import { useMemo } from "react";
import type { CSSProperties } from "react";
import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";
import { PanelWrapper } from "./PanelWrapper";
import ObserverWrapper from "@src/components/ObserverWrapper";
import {
  XL_CONTROL_BUTTON_SIZE,
  XL_CONTROL_MARGIN_BOTTOM,
  XL_CONTROL_PADDING_BOTTOM,
  XL_CONTROL_PADDING_TOP,
  XL_CONTROLS_ENABLED,
  XL_CONTROL_MIN_HEIGHT,
} from "@src/constants/xlControls";
import { useUIStore } from "@src/stores/uiStore";

export const CallStatusPanel = () => {
  const callStatus = useCallStore((state) => state.callStatus);
  const panelDimensions = useUIStore((state) => state.dimensions.panel);
  const controlDimensions = useUIStore((state) => state.dimensions.controls);
  const participants = callStatus?.participants ?? [];

  const { participantTileStyle, layoutStyles } = useMemo(() => {
    const minTileSize = 72;
    const gap = 24; // gap-6
    const horizontalPadding = 48; // approximate padding from p-4/md:p-6
    const verticalPadding = 48;

    const count = participants.length || 1;
    const columns = Math.min(count, Math.max(1, Math.ceil(Math.sqrt(count))));
    const rows = Math.max(1, Math.ceil(count / columns));

    const availableWidth = Math.max(panelDimensions.width - horizontalPadding, minTileSize);
    const availableHeight = Math.max(panelDimensions.height - verticalPadding, minTileSize);

    const sizeByWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);
    const sizeByHeight = Math.floor((availableHeight - gap * (rows - 1)) / rows);

    const computedSize = Math.max(minTileSize, Math.min(sizeByWidth, sizeByHeight));

    const controlSurfaceHeight = XL_CONTROLS_ENABLED
      ? Math.max(
          XL_CONTROL_MIN_HEIGHT,
          controlDimensions.height -
            (XL_CONTROL_PADDING_TOP +
              XL_CONTROL_PADDING_BOTTOM +
              XL_CONTROL_MARGIN_BOTTOM),
        )
      : controlDimensions.height;

    const baseControlSize = XL_CONTROLS_ENABLED
      ? Math.max(XL_CONTROL_BUTTON_SIZE, controlSurfaceHeight)
      : computedSize;

    const normalizedSize = XL_CONTROLS_ENABLED
      ? Math.min(
          Math.max(computedSize, baseControlSize * 0.85),
          baseControlSize * 1.35,
        )
      : computedSize;

    const tileStyle: CSSProperties = {
      width: normalizedSize,
      height: normalizedSize,
    };

    const wrapperStyle: CSSProperties = {
      gridTemplateColumns: `repeat(${columns}, minmax(${normalizedSize}px, 1fr))`,
      gridAutoRows: normalizedSize,
      gap,
    };

    return { participantTileStyle: tileStyle, layoutStyles: wrapperStyle };
  }, [
    controlDimensions.height,
    panelDimensions.height,
    panelDimensions.width,
    participants.length,
  ]);

  return (
    <div className="relative z-0 flex w-full justify-center px-4">
      <PanelWrapper>
        <div className="w-full h-full">
          {participants.length > 0 ? (
            <div
              style={layoutStyles}
              className="grid items-center justify-items-center p-4 md:p-6"
            >
              {participants.map((participant) => (
                <ObserverWrapper
                  key={participant.id}
                  className="p-2 flex items-center justify-center"
                  style={participantTileStyle}
                >
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
                  d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.58 2-5-8-5z"
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
    </div>
  );
};
