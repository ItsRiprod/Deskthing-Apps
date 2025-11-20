import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS, Action } from "@deskthing/types";
import StoreProvider from "./storeProvider";
import { DISCORD_ACTIONS } from "../shared/types/discord"
import { MessageObject, MessageType } from "./discord/types/discordApiTypes";

// Organize actions by category
const voiceActions: Action[] = [
  {
    name: "Mute",
    description: "Toggles the mute status of the current user",
    id: DISCORD_ACTIONS.MUTE,
    icon: "mic", // or mic_off
    value: "toggle",
    value_options: ["mute", "unmute", "toggle"],
    value_instructions: "Choose whether to mute or unmute the user",
    version: "0.11.2",
    tag: "basic",
    enabled: true,
  },
  {
    name: "Deafen",
    description: "Toggles the deaf state of the current user",
    id: DISCORD_ACTIONS.DEAFEN,
    icon: "deafen", // or deafen_off
    value: "toggle",
    value_options: ["deafen", "undeafen", "toggle"],
    value_instructions: "Choose whether to deafen or undeafen the user",
    version: "0.11.2",
    tag: "basic",
    enabled: true,
  },
  {
    name: "Disconnect",
    description: "Disconnects the user from the call",
    id: DISCORD_ACTIONS.DISCONNECT,
    icon: "disconnect",
    version: "0.11.2",
    tag: "basic",
    enabled: true,
  },
];

const createTestNotificationMessage = (body?: string): MessageObject => ({
  id: `deskthing-test-${Date.now()}`,
  channel_id: "deskthing-test-channel",
  author: {
    id: "deskthing-test-user",
    username: "DeskThing Tester",
    discriminator: "0000",
    avatar: null,
  },
  content: body?.trim() || "This is a test notification from DeskThing.",
  timestamp: new Date().toISOString(),
  edited_timestamp: null,
  tts: false,
  mention_everyone: false,
  mentions: [],
  mention_roles: [],
  attachments: [],
  embeds: [],
  pinned: false,
  type: MessageType.DEFAULT,
});

const notificationActions: Action[] = [
  {
    name: "Mark Notification As Read",
    description: "Marks a notification as read by ID",
    id: "markNotificationAsRead",
    icon: "mark_notification_as_read_icon",
    version: "0.11.2",
    tag: "basic",
    enabled: false,
    value: "",
    value_instructions: "Input the notification ID",
  },
  {
    name: "Mark All Notifications As Read",
    description: "Marks all notifications as read",
    id: "markAllNotificationsAsRead",
    icon: "mark_all_notifications_as_read_icon",
    version: "0.11.2",
    tag: "basic",
    enabled: false,
  },
  {
    name: "Send Test Notification",
    description: "Creates a mock Discord notification so you can preview the toast UI",
    id: DISCORD_ACTIONS.SEND_TEST_NOTIFICATION,
    icon: "notification", // placeholder icon until a bell icon exists
    version: "0.11.2",
    tag: "basic",
    enabled: true,
  },
];


const authActions: Action[] = [
  {
    name: "Re Auth",
    description: "Reinitializes the auth process for the user",
    id: "reauth",
    icon: "reauth",
    version: "0.11.2",
    tag: "basic",
    enabled: true,
  },
];

const presenceActions: Action[] = [
  {
    name: "Restart Rich Presence",
    description: "Enables and reinitializes the rich presence",
    id: "represence",
    icon: "represence",
    version: "0.11.2",
    tag: "basic",
    enabled: true,
  },
];

// Register actions by category
export const setupActions = () => {
  DeskThing.initActions([
    ...voiceActions,
    ...authActions,
    ...presenceActions,
    ...notificationActions,
  ])
};

type actionHandler = (value: string | undefined) => Promise<void>;

const actionHandlers: Record<string, actionHandler> = {
  // Voice
  [DISCORD_ACTIONS.MUTE]: async (value) => {
    switch (value) {
      case "mute":
        return StoreProvider.getCallControls().mute();
      case "unmute":
        return StoreProvider.getCallControls().unmute();
      case "toggle":
      default:
        return StoreProvider.getCallControls().toggleMute();
    }
  },
  [DISCORD_ACTIONS.DEAFEN]: async (value) => {
    switch (value) {
      case "deafen":
        return StoreProvider.getCallControls().deafen();
      case "undeafen":
        return StoreProvider.getCallControls().undeafen();
      case "toggle":
      default:
        return StoreProvider.getCallControls().toggleDeafen();
    }
  },
  [DISCORD_ACTIONS.DISCONNECT]: async () => {
    return StoreProvider.getCallControls().disconnect();
  },

  // Utility
  [DISCORD_ACTIONS.REAUTH]: async () => {
    await StoreProvider.getAuth().authenticate();
  },

  [DISCORD_ACTIONS.REPRESENCE]: async () => {
    return StoreProvider.getRichPresence().resetActivity();
  },

  // Actions
  [DISCORD_ACTIONS.EXPAND_CHAT]: () => {
    return StoreProvider.getChatStatus().setChatExpand(true);
  },
  [DISCORD_ACTIONS.COLLAPSE_CHAT]: () => {
    return StoreProvider.getChatStatus().setChatExpand(false);
  },
  [DISCORD_ACTIONS.SELECT_TEXT_CHANNEL]: (value) => {
    return StoreProvider.getChatStatus().selectTextChannel(value);
  },
  // Notifications
  [DISCORD_ACTIONS.MARK_NOTIFICATION_AS_READ]: (value) => {
    return StoreProvider.getNotificationStatus().markNotificationAsRead(value || '');
  },
  [DISCORD_ACTIONS.MARK_ALL_NOTIFICATIONS_AS_READ]: () => {
    return StoreProvider.getNotificationStatus().markAllNotificationsAsRead();
  },
  [DISCORD_ACTIONS.SEND_TEST_NOTIFICATION]: async (value) => {
    const notificationStore = StoreProvider.getNotificationStatus();
    const message = createTestNotificationMessage(value);
    await notificationStore.addNewNotificationMessage(message, "Test Notification");
  },
};

DeskThing.on(DESKTHING_EVENTS.ACTION, async (actionData) => {
  const { id, value } = actionData.payload;
  const handler = actionHandlers[id];

  if (handler) {
    console.log(`Received ${id} action`);
    try {
      await handler(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error handling ${id}: ${message}`);
    }
  }
});