import { create } from "zustand";
import { ChatStatus, GuildListStatus, NotificationStatus, ChannelStatus } from "@shared/types/discord";
import { createDeskThing } from "@deskthing/client";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";

type ChatStoreState = {
  initialized: boolean;
  isLoading: boolean;
  chatStatus: ChatStatus | null;
  guildList: GuildListStatus | null;
  channels: ChannelStatus[];
  notificationStatus: NotificationStatus | null;
  selectedGuildId: string | null;
  selectedChannelId: string | null;
  initialize: () => void;
  setSelectedGuildID: (guildId: string) => void;
  setSelectedChannelID: (channelId: string) => void;
  getGuildList: () => void;
  clearSelectedGuild: () => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
};

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

export const useChatStore = create<ChatStoreState>((set, get) => ({
  initialized: false,
  isLoading: true,
  chatStatus: null,
  guildList: null,
  channels: [],
  notificationStatus: null,
  selectedGuildId: null,
  selectedChannelId: null,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Chat status listener
    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "chat" },
      { type: DiscordEvents.CHAT, request: "set" },
      (chatStatus) => {
        if (chatStatus) set({ chatStatus: chatStatus.payload, isLoading: false });
      }
    );
    DeskThing.on(DiscordEvents.CHAT, (event) => {
      if (event.request === "set" && event.payload) {
        set({ chatStatus: event.payload, isLoading: false });
      }
    });

    // Guild list listener
    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "guildList" },
      { type: DiscordEvents.GUILD_LIST, request: "set" },
      (guildList) => {
        if (guildList) set({ guildList: guildList.payload });
      }
    );
    DeskThing.on(DiscordEvents.GUILD_LIST, (event) => {
      if (event.request === "set" && event.payload) {
        console.log('Got the guild list')
        set({ guildList: event.payload, isLoading: false });
      }
    });

    // Channels listener
    DeskThing.on(DiscordEvents.CHANNELS, (event) => {
      if (event.request === "set" && event.payload) {
        set({ channels: event.payload.channels, isLoading: false });
      }
    });

    // Notification listener
    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "notification" },
      { type: DiscordEvents.NOTIFICATION, request: "set" },
      (notificationStatus) => {
        if (notificationStatus) set({ notificationStatus: notificationStatus.payload });
      }
    );
    DeskThing.on(DiscordEvents.NOTIFICATION, (event) => {
      if (event.request === "set" && event.payload) {
        set({ notificationStatus: event.payload });
      }
    });
  },

  setSelectedGuildID: (guildId) => {
    if (get().selectedGuildId === guildId) return;
    set({ isLoading: true, selectedGuildId: guildId, selectedChannelId: null });
    DeskThing.send({
      type: DiscordEvents.SET,
      request: "guild",
      payload: { guildId },
    });
  },

  setSelectedChannelID: (channelId) => {
    if (get().selectedChannelId === channelId) return;
    set({
      selectedChannelId: channelId,
      chatStatus: {
        ...(get().chatStatus || {}),
        currentChannelId: channelId,
        isLoading: true,
        messages: [],
        typingUsers: [],
      },
    });
    DeskThing.send({
      type: DiscordEvents.SET,
      request: "channel",
      payload: { channelId },
    });
  },

  getGuildList: () => {
    set({ isLoading: true });
    DeskThing.send({ type: DiscordEvents.GET, request: "refreshGuildList" });
  },

  clearSelectedGuild: () => {
    set({ selectedGuildId: null, channels: [] });
  },

  markNotificationAsRead: (notificationId) => {
    set((state) => ({
      notificationStatus: state.notificationStatus
        ? {
            ...state.notificationStatus,
            notifications: state.notificationStatus.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          }
        : null,
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notificationStatus: state.notificationStatus
        ? {
            ...state.notificationStatus,
            notifications: state.notificationStatus.notifications.map((n) => ({
              ...n,
              read: true,
            })),
          }
        : null,
    }));
  },
}));