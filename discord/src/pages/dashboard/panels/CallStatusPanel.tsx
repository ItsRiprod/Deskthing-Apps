import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";
import { useChatStore } from "@src/stores/chatStore";
import { PanelWrapper } from "./PanelWrapper";
import ObserverWrapper from "@src/components/ObserverWrapper";
import { useUIStore } from "@src/stores/uiStore";
import { ChannelStatus, AppSettingIDs } from "@shared/types/discord";

export const CallStatusPanel = () => {
  const callStatus = useCallStore((state) => state.callStatus);
  const refreshCallStatus = useCallStore((state) => state.refreshCallStatus);
  const guildList = useChatStore((state) => state.guildList);
  const selectedChannelId = useChatStore((state) => state.selectedChannelId);
  const refreshGuildList = useChatStore((state) => state.getGuildList);
  const participants = callStatus?.participants ?? [];
  const isInCall = !!callStatus?.isConnected;
  const panelDimensions = useUIStore((s) => s.dimensions.panel);
  const settings = useUIStore((s) => s.settings);
  const showRefreshButton =
    settings?.[AppSettingIDs.CALL_REFRESH_BUTTON]?.value ?? false;
  const [refreshing, setRefreshing] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const { guildName, channelName, resolvedGuildId } = useMemo(() => {
    const guildChannels =
      (
        guildList as (typeof guildList & { channels?: ChannelStatus[] })
      )?.channels ?? guildList?.textChannels ?? [];
    const resolvedChannelId =
      callStatus?.channel?.id ?? callStatus?.channelId ?? selectedChannelId;

    const resolvedChannel =
      guildChannels.find((channel) => channel.id === resolvedChannelId) ??
      callStatus?.channel ??
      null;

    const resolvedGuildId = resolvedChannel?.guild_id ?? callStatus?.channel?.guild_id;
    const resolvedGuildName = resolvedGuildId
      ? guildList?.guilds.find((guild) => guild.id === resolvedGuildId)?.name ??
        // Possible the guild list is stale or missing; fall back to an id-based label.
        (callStatus?.channel as any)?.guild_name ??
        resolvedGuildId ??
        "Unknown Server"
      : null;

    return {
      guildName: resolvedGuildName,
      channelName: resolvedChannel?.name ?? "Unknown Channel",
      resolvedGuildId,
    };
  }, [
    callStatus?.channel?.guild_id,
    callStatus?.channel?.id,
    callStatus?.channel?.name,
    callStatus?.channelId,
    guildList,
    selectedChannelId,
  ]);

  useEffect(() => {
    if (resolvedGuildId && !guildList?.guilds?.some((g) => g.id === resolvedGuildId)) {
      refreshGuildList();
    }
  }, [resolvedGuildId, guildList, refreshGuildList]);

  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    } else {
      setHeaderHeight(0);
    }
  }, [isInCall, participants.length]);

  const participantCount = participants.length;

  // Layout logic: choose as many columns as fit with a minimum tile size, and wrap to new rows.
  const minCell = 90;
  const maxCell = 150;
  const gap = 12;
  const paddingX = 24;
  const paddingY = 24;

  const widthForGrid = Math.max(panelDimensions.width - paddingX * 2, minCell);
  const estColumns = Math.max(
    1,
    Math.floor((widthForGrid + gap) / (minCell + gap))
  );
  const columns = Math.max(1, Math.min(estColumns, Math.max(1, participantCount)));
  const rows = Math.max(1, Math.ceil(participantCount / columns));

  const availableWidth = Math.max(
    widthForGrid - gap * (columns - 1),
    minCell
  );
  const availableHeight = Math.max(
    panelDimensions.height - headerHeight - paddingY * 2 - gap * (rows - 1),
    minCell
  );

  const idealSize = Math.min(availableWidth / columns, availableHeight / rows);
  const cellSize = Math.min(Math.max(idealSize, minCell), maxCell);
  const allowScroll = participantCount > rows * columns;

  const gridStyles: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(${cellSize}px, 1fr))`,
    gridAutoRows: `${cellSize}px`,
    gap,
    padding: "16px 18px",
    alignContent: "center",
    justifyItems: "center",
    overflowY: allowScroll ? "auto" : "hidden",
  };

  return (
    <div className="relative z-0 flex w-full h-full">
      <PanelWrapper scrollable={allowScroll}>
        <div className="w-full h-full flex flex-col">
          {isInCall && (
            <div
              ref={headerRef}
              className="px-4 md:px-6 pt-3 md:pt-4 pb-2 border-b border-neutral-800 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-sm text-neutral-200 min-w-0">
                {guildName ? (
                  <>
                    <span className="font-semibold text-neutral-100">{guildName}</span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-300">{channelName}</span>
                  </>
                ) : (
                  <span className="text-neutral-300">{channelName}</span>
                )}
              </div>
              {showRefreshButton && (
                <button
                  type="button"
                  onClick={() => {
                    if (refreshing) return;
                    setRefreshing(true);
                    refreshCallStatus();
                    setTimeout(() => setRefreshing(false), 1200);
                  }}
                  className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-md border transition-colors ${
                    refreshing
                      ? "text-neutral-300 bg-neutral-700 border-neutral-600 cursor-wait"
                      : "text-neutral-100 bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700"
                  }`}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              )}
            </div>
          )}
          <div className="flex-1">
            {!isInCall ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-neutral-300">
                <svg
                  width="48"
                  height="48"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="mb-3 text-neutral-500"
                >
                  <path
                    d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.58-5-8-5z"
                    fill="currentColor"
                  />
                </svg>
                <div className="text-lg font-semibold text-neutral-100 mb-1">
                  Not in a call
                </div>
                <div className="text-sm text-neutral-400">
                  Join a voice channel to see participants here.
                </div>
              </div>
            ) : participants.length > 0 ? (
              <div
                className="grid items-center justify-items-center w-full h-full"
                style={gridStyles}
              >
                {participants.map((participant) => (
                  <ObserverWrapper
                    key={participant.id}
                    className="flex items-center justify-center w-full h-full"
                    style={{ width: "100%", height: "100%" }}
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
                    d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.58-5-8-5z"
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
        </div>
      </PanelWrapper>
    </div>
  );
};
