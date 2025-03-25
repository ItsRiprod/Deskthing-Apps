import { createDeskThing } from "@deskthing/server";
import { AppSettingIDs } from "./discord/types/deskthingTypes";
import StoreProvider from "./storeProvider";
import { DESKTHING_EVENTS } from "@deskthing/types";
import {
  DiscordEvents,
  ToClientTypes,
  ToServerTypes,
} from "../shared/types/transit";

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>();

export const initializeDiscord = async () => {
  const settings = await DeskThing.getSettings();

  if (!settings) {
    DeskThing.sendDebug(
      "Settings have not been defined yet - cancelling the initialization"
    );
    return;
  }

  const clientId = settings[AppSettingIDs.CLIENT_ID].value;
  const clientSecret = settings[AppSettingIDs.CLIENT_SECRET].value;

  if (
    !clientId ||
    !clientSecret ||
    typeof clientId !== "string" ||
    typeof clientSecret !== "string"
  ) {
    DeskThing.sendDebug(
      "Client ID or Client Secret is not defined - cancelling the initialization"
    );
    return;
  }

  try {
    StoreProvider.getAuth().setClientId(clientId);
    StoreProvider.getAuth().setClientSecret(clientSecret);
    StoreProvider.getAuth().authenticate();
  } catch (error) {
    DeskThing.sendError(`Failed to initialize Discord: ${error}`);
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
    default:
      return;
  }
});

DeskThing.on(DiscordEvents.SET, (socketData) => {
  const guildStore = StoreProvider.getGuildList();
  const chatStore = StoreProvider.getChatStatus();

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
  }
});
