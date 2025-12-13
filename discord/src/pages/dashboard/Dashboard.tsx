import { JSX } from "react";
import {
  AppSettingIDs,
  CLOCK_OPTIONS,
  CONTROL_POSITION,
  DASHBOARD_ELEMENTS,
  PANEL_ELEMENTS,
} from "@shared/types/discord";
import { CallStatusPanel } from "./panels/CallStatusPanel";
import { ChatPanel } from "./panels/ChatPanel";
import { SongPanel } from "./panels/SongPanel";
import { GuildListPanel } from "./panels/GuildListPanel";
import { ClockWidget } from "./widgets/ClockWidget";
import { MiniCallWidget } from "./widgets/MiniCallWidget";
import { NotificationWidget } from "./widgets/NotificationWidget";
import { useUIStore } from "@src/stores/uiStore";
import { CallControlsWidget } from "./widgets/CallControlsWidget";
import { BgAlbumArtWidget } from "./widgets/BgAlbumArtWidget";
import { ClockPanel } from "./panels/ClockPanel";

const PanelMap: Record<PANEL_ELEMENTS, () => JSX.Element | null> = {
  [PANEL_ELEMENTS.CALL_STATUS]: CallStatusPanel,
  [PANEL_ELEMENTS.CHAT]: ChatPanel,
  [PANEL_ELEMENTS.SONG]: SongPanel,
  [PANEL_ELEMENTS.GUILD_LIST]: GuildListPanel,
  [PANEL_ELEMENTS.BLANK]: () => null,
  [PANEL_ELEMENTS.CLOCK]: ClockPanel,
};

export function Dashboard(): JSX.Element {
  const leftPanel = useUIStore((state) => state.leftPanel);
  const rightPanel = useUIStore((state) => state.rightPanel);
  const widgets = useUIStore((state) => state.widgets);
  const clock_setting = useUIStore((state) => state.clock_options);
  const settings = useUIStore((state) => state.settings);

  const LeftPanelComponent = PanelMap[leftPanel];
  const RightPanelComponent = PanelMap[rightPanel];

  const showLeft = leftPanel !== PANEL_ELEMENTS.BLANK;
  const showRight = rightPanel !== PANEL_ELEMENTS.BLANK;
  const callControlsPosition =
    (settings?.[AppSettingIDs.CONTROLS_POSITION]?.value as CONTROL_POSITION | undefined) ??
    CONTROL_POSITION.TOP;
  const panelSplitRatio = useUIStore((state) => state.panel_split_ratio ?? 0.5);

  const renderCallControls = widgets.includes(DASHBOARD_ELEMENTS.CALL_CONTROLS);



  return (
    <div className="relative w-full h-full max-h-screen">
      {widgets.includes(DASHBOARD_ELEMENTS.BG_ALBUM) && <BgAlbumArtWidget />}
      <div className="flex z-10 flex-col w-full h-full">
        {renderCallControls && callControlsPosition === CONTROL_POSITION.TOP && (
          <CallControlsWidget />
        )}
        <div className="flex w-full flex-grow h-full max-h-full overflow-hidden items-stretch justify-start gap-[6px] px-0">
          {showLeft && LeftPanelComponent && (
            <div
              className="h-full flex min-w-0"
              style={
                showRight
                  ? {
                      flex: `0 0 ${panelSplitRatio * 100}%`,
                      maxWidth: `${panelSplitRatio * 100}%`,
                    }
                  : { flex: "1 1 0%", maxWidth: "100%" }
              }
            >
              <LeftPanelComponent />
            </div>
          )}
          {showRight && RightPanelComponent && (
            <div
              className="h-full flex min-w-0"
              style={
                showLeft
                  ? {
                      flex: `1 1 0%`,
                      maxWidth: `${(1 - panelSplitRatio) * 100}%`,
                    }
                  : { flex: "1 1 0%", maxWidth: "100%" }
              }
            >
              <RightPanelComponent />
            </div>
          )}
        </div>
        {renderCallControls && callControlsPosition === CONTROL_POSITION.BOTTOM && (
          <CallControlsWidget />
        )}
      </div>

      {/* Widgets rendered absolutely */}
      {clock_setting !== CLOCK_OPTIONS.DISABLED && <ClockWidget />}
      {widgets.includes(DASHBOARD_ELEMENTS.MINI_CALL) && <MiniCallWidget />}
      {widgets.includes(DASHBOARD_ELEMENTS.NOTIFICATIONS) && (
        <NotificationWidget />
      )}
    </div>
  );
}
