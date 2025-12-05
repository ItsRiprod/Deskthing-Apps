import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";
import { useChatStore } from "@src/stores/chatStore";
import { PanelWrapper } from "./PanelWrapper";
import ObserverWrapper from "@src/components/ObserverWrapper";
import { useUIStore } from "@src/stores/uiStore";
import { ChannelStatus } from "@shared/types/discord";

export const CallStatusPanel = () => {
  const callStatus = useCallStore((state) => state.callStatus);
  const panelDimensions = useUIStore((state) => state.dimensions.panel);
  const guildList = useChatStore((state) => state.guildList);
  const selectedChannelId = useChatStore((state) => state.selectedChannelId);
  const refreshGuildList = useChatStore((state) => state.getGuildList);
  const participants = callStatus?.participants ?? [];
  const isInCall = !!callStatus?.isConnected;

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
      : "Direct Message";

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

  const { participantTileStyle, layoutStyles } = useMemo(() => {
    const minTileSize = 72;
    const gap = 24; // gap-6
    const horizontalPadding = 48; // approximate padding from p-4/md:p-6
    const verticalPadding = 48;
    const headerHeight = 64; // approximate height of the header block including padding/border

    const count = participants.length || 1;
    const columns = Math.min(count, Math.max(1, Math.ceil(Math.sqrt(count))));
    const rows = Math.max(1, Math.ceil(count / columns));

    const availableWidth = Math.max(panelDimensions.width - horizontalPadding, minTileSize);
    const availableHeight = Math.max(
      panelDimensions.height - verticalPadding - headerHeight,
      minTileSize,
    );

    const sizeByWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);
    const sizeByHeight = Math.floor((availableHeight - gap * (rows - 1)) / rows);

    const computedSize = Math.max(minTileSize, Math.min(sizeByWidth, sizeByHeight));

    const availableTileHeight = Math.max(
      minTileSize,
      Math.floor((availableHeight - gap * (rows - 1)) / rows),
    );

    const normalizedSize = Math.max(
      minTileSize,
      Math.min(computedSize, availableTileHeight),
    );

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
  }, [panelDimensions.height, panelDimensions.width, participants.length]);

  return (
    <div className="relative z-0 flex w-full justify-center px-4">
      <PanelWrapper scrollable={false}>
        <div className="w-full h-full flex flex-col">
          {isInCall && (
            <div className="px-4 md:px-6 pt-3 md:pt-4 pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-sm text-neutral-200">
                <span className="font-semibold text-neutral-100">{guildName}</span>
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-300">{channelName}</span>
              </div>
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
