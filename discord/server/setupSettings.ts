import { DeskThing } from "@deskthing/server";
import {
  DESKTHING_EVENTS,
  SETTING_TYPES,
} from "@deskthing/types";
import { AppSettingIDs } from "../shared/types/discord";
import StoreProvider from "./storeProvider";

export const setupSettings = () => {
  DeskThing.initSettings({
    [AppSettingIDs.CLIENT_ID]: {
      id: AppSettingIDs.CLIENT_ID,
      type: SETTING_TYPES.STRING,
      description: "Discord Client ID",
      label: "Client ID",
      value: "",
    },
    [AppSettingIDs.CLIENT_SECRET]: {
      id: AppSettingIDs.CLIENT_SECRET,
      type: SETTING_TYPES.STRING,
      description: "Client Secret Code",
      label: "Client Secret",
      value: "",
    },
    [AppSettingIDs.SET_MAIN_TEXT]: {
      id: AppSettingIDs.SET_MAIN_TEXT,
      type: SETTING_TYPES.STRING,
      description: "Main Text",
      label: "Main Text",
      value: "",
    },
    [AppSettingIDs.SET_SECONDARY_TEXT]: {
      id: AppSettingIDs.SET_SECONDARY_TEXT,
      type: SETTING_TYPES.STRING,
      description: "Secondary Text",
      label: "Secondary Text",
      value: "",
    },
    [AppSettingIDs.HAVE_TIMER]: {
      id: AppSettingIDs.HAVE_TIMER,
      type: SETTING_TYPES.BOOLEAN,
      description: "Include timer with Rich Presence?",
      label: "Have Timer",
      value: true,
    },
  });
};

// Updates redirect url, id, and secret from user input from either settings OR from the task
DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (settingData) => {
  const settings = settingData.payload;

  if (!settings) return

  Object.entries(settings).forEach(([key, setting]) => {
    switch (key) {
      case AppSettingIDs.CLIENT_ID:
        if (setting.type == SETTING_TYPES.STRING) {
            setting.value && StoreProvider.getAuth().setClientId(setting.value);
        }
        break;
      case AppSettingIDs.CLIENT_SECRET:
        if (setting.type == SETTING_TYPES.STRING) {
            setting.value && StoreProvider.getAuth().setClientSecret(setting.value);
        }
        // update discord
        break;
    }
  });
});
