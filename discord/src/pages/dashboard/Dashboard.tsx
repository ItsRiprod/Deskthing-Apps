import { JSX } from "react";
import { DASHBOARD_ELEMENTS, PANEL_ELEMENTS } from "@shared/types/discord";
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

const PanelMap: Record<PANEL_ELEMENTS, () => JSX.Element | null> = {
  [PANEL_ELEMENTS.CALL_STATUS]: CallStatusPanel,
  [PANEL_ELEMENTS.CHAT]: ChatPanel,
  [PANEL_ELEMENTS.SONG]: SongPanel,
  [PANEL_ELEMENTS.GUILD_LIST]: GuildListPanel,
  [PANEL_ELEMENTS.BLANK]: () => null,
};

export function Dashboard(): JSX.Element {
  const leftPanel = useUIStore((state) => state.leftPanel);
  const rightPanel = useUIStore((state) => state.rightPanel);
  const widgets = useUIStore((state) => state.widgets);

  const LeftPanelComponent = PanelMap[leftPanel];
  const RightPanelComponent = PanelMap[rightPanel];

  const showLeft = leftPanel !== PANEL_ELEMENTS.BLANK;
  const showRight = rightPanel !== PANEL_ELEMENTS.BLANK;

  return (
    <div className="relative w-screen h-screen">
      {widgets.includes(DASHBOARD_ELEMENTS.BG_ALBUM) && <BgAlbumArtWidget />}
      <div className="absolute top-0 flex p-5 flex-col w-full h-full">
        <div className="flex h-full items-center space-x-5 justify-center">
          {showLeft && LeftPanelComponent && <LeftPanelComponent />}
          {showRight && RightPanelComponent &&  <RightPanelComponent />}
        </div>
        {widgets.includes(DASHBOARD_ELEMENTS.CALL_CONTROLS) && (
          <CallControlsWidget />
        )}
      </div>

      {/* Widgets rendered absolutely */}
      {widgets.includes(DASHBOARD_ELEMENTS.CLOCK) && <ClockWidget />}
      {widgets.includes(DASHBOARD_ELEMENTS.MINI_CALL) && <MiniCallWidget />}
      {widgets.includes(DASHBOARD_ELEMENTS.NOTIFICATIONS) && (
        <NotificationWidget />
      )}
    </div>
  );
}
