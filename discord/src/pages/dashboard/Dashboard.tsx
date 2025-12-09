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

  const renderCallControls = widgets.includes(DASHBOARD_ELEMENTS.CALL_CONTROLS);



  return (
    <div className="relative w-full h-full max-h-screen">
      {widgets.includes(DASHBOARD_ELEMENTS.BG_ALBUM) && <BgAlbumArtWidget />}
      <div className="flex z-10 flex-col w-full h-full">
        {renderCallControls && callControlsPosition === CONTROL_POSITION.TOP && (
          <CallControlsWidget />
        )}
        <div className="flex flex-grow max-h-full overflow-hidden items-center justify-center flex-row-reverse">
          {showLeft && LeftPanelComponent && <LeftPanelComponent />}
          {showRight && RightPanelComponent && <RightPanelComponent />}
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
