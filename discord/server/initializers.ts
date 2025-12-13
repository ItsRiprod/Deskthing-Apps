import { createDeskThing } from "@deskthing/server";
import { AppSettingIDs, DiscordSettings } from "../shared/types/discord";
import StoreProvider from "./storeProvider";
import {
  DiscordEvents,
  ToClientTypes,
  ToServerTypes,
} from "../shared/types/transit";

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>();

export const initializeDiscord = async () => {
  try {
    const settings = await DeskThing.getSettings();

    if (!settings) {
      console.debug(
        "Settings have not been defined yet - cancelling the initialization"
      );
      return;
    }

    const clientId = settings[AppSettingIDs.CLIENT_ID]?.value;
    const clientSecret = settings[AppSettingIDs.CLIENT_SECRET]?.value;

    if (
      !clientId ||
      !clientSecret ||
      typeof clientId !== "string" ||
      typeof clientSecret !== "string"
    ) {
      console.debug(
        "Client ID or Client Secret is not defined - cancelling the initialization"
      );
      return;
    }

    StoreProvider.getAuth().setClientId(clientId);
    StoreProvider.getAuth().setClientSecret(clientSecret);
    StoreProvider.getAuth().authenticate();
  } catch (error) {
    console.error(`Failed to initialize Discord: ${error}`);
  }
};

DeskThing.on(DiscordEvents.GET, async (socketData) => {
  const callStore = StoreProvider.getCallStatus();
  const chatStore = StoreProvider.getChatStatus();
  const notificationStore = StoreProvider.getNotificationStatus();
  const guildStore = StoreProvider.getGuildList();

  switch (socketData.request) {
    case "call":
      {
        const callStatus = callStore.getStatus();
        DeskThing.send({
          type: DiscordEvents.CALL,
          payload: callStatus,
          request: "set",
        });
      }
      break;
    case "chat":
      {
        const chatStatus = chatStore.getStatus();
        DeskThing.send({
          type: DiscordEvents.CHAT,
          payload: chatStatus,
          request: "set",
        });
      }
      break;
    case "notification":
      {
        const notificationStatus = notificationStore.getStatus();
        DeskThing.send({
          type: DiscordEvents.NOTIFICATION,
          payload: notificationStatus,
          request: "set",
        });
      }
      break;
    case "guildList":
      {
        const guildList = guildStore.getStatus();
        DeskThing.send({
          type: DiscordEvents.GUILD_LIST,
          payload: guildList,
          request: "set",
        });
      }
      break;
    case "refreshGuildList":
      {
        guildStore.refreshGuildList();
      }

      break;
    case "settings":
      {
        const settings = await DeskThing.getSettings() as DiscordSettings | undefined
        if (settings) {
          DeskThing.send({
            type: DiscordEvents.SETTINGS,
            request: 'set',
            payload: settings,
            clientId: socketData.clientId // will be filled in by the server
          })
        }
      }

      break;
    default:
      return;
  }
});

DeskThing.on(DiscordEvents.SET, async (socketData) => {
  const guildStore = StoreProvider.getGuildList();
  const chatStore = StoreProvider.getChatStatus();
  const notificationStore = StoreProvider.getNotificationStatus();

  switch (socketData.request) {
    case "guild":
      {
        guildStore.updateSelectedGuild(socketData.payload.guildId);
      }
      break;
    case "channel":
      {
        chatStore.selectTextChannel(socketData.payload.channelId);
      }
      break;
    case "refreshCall":
      {
        const callStore = StoreProvider.getCallStatus();
        callStore.refreshCurrentChannel("manual-refresh");
      }
      break;
    case "notificationToasts":
      {
        try {
          const settings = await DeskThing.getSettings() as DiscordSettings | undefined;
          const toastSetting = settings?.[AppSettingIDs.NOTIFICATION_TOASTS];
          if (!toastSetting) return;

          await DeskThing.setSettings({
            [AppSettingIDs.NOTIFICATION_TOASTS]: {
              ...toastSetting,
              value: Boolean(socketData.payload?.enabled),
            },
          });

          const updatedSettings = await DeskThing.getSettings() as DiscordSettings | undefined;
          if (updatedSettings) {
            DeskThing.send({
              type: DiscordEvents.SETTINGS,
              request: "set",
              payload: updatedSettings,
            });
          }
        } catch (error) {
          console.error("Failed to update notification toast setting", error);
        }
      }
      break;
    case "notificationRead": {
      const notificationId = socketData.payload?.notificationId;
      if (notificationId) {
        notificationStore.markNotificationAsRead(notificationId);
      }
      break;
    }
    case "notificationsReadAll":
      notificationStore.markAllNotificationsAsRead();
      break;
  }
});
