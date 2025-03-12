import { DeskThing } from "@deskthing/server";
import { AppSettingIDs } from "./discord/types/deskthingTypes";
import StoreProvider from "./storeProvider";
import { ServerEvent } from "@deskthing/types"

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

DeskThing.on(ServerEvent.GET, async (socketData) => {
    switch (socketData.request) {
      case 'call': {
        const callStore = StoreProvider.getCallStatus()
        const callStatus = callStore.getStatus()
        DeskThing.send({
          type: 'call',
          payload: callStatus,
          request: 'set',
        })
      }
      case 'chat': {
        const chatStore = StoreProvider.getChatStatus()
        const chatStatus = chatStore.getStatus()
        DeskThing.send({
          type: 'chat',
          payload: chatStatus,
          request: 'set',
        })
      }
      case 'notification': {
        const notificationStore = StoreProvider.getNotificationStatus()
        const notificationStatus = notificationStore.getStatus()
        DeskThing.send({
          type: 'notification',
          payload: notificationStatus,
          request: 'set',
        })
      }
      case 'guildList': {
        const guildStore = StoreProvider.getGuildList()
        const guildList = guildStore.getStatus()
        DeskThing.send({
          type: 'guildList',
          payload: guildList,
          request: 'set',
        })
      }
        default:
        return
    }
  })