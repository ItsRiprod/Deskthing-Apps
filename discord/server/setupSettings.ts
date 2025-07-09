import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import {
  AppSettingIDs,
  DASHBOARD_ELEMENTS,
  DiscordSettings,
} from "../shared/types/discord";
import StoreProvider from "./storeProvider";

export const setupSettings = () => {
  const discordSettings: DiscordSettings = {
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
    [AppSettingIDs.LEFT_DASHBOARD_PANEL]: {
      id: AppSettingIDs.LEFT_DASHBOARD_PANEL,
      type: SETTING_TYPES.SELECT,
      description: "What elements to show on the dashboard?",
      label: "Dashboard Elements",
      value: DASHBOARD_ELEMENTS.CALL_STATUS,
      options: [
        {
          value: DASHBOARD_ELEMENTS.CALL_STATUS,
          label: "Call Status",
        },
        {
          value: DASHBOARD_ELEMENTS.GUILD_LIST,
          label: "Guild List",
        },
        {
          value: DASHBOARD_ELEMENTS.CHAT,
          label: "Current Chat",
        },
        {
          value: DASHBOARD_ELEMENTS.SHORTCUTS,
          label: "Shortcuts",
        },
        {
          value: DASHBOARD_ELEMENTS.SONG,
          label: "Song",
        },
      ],
    },
    [AppSettingIDs.RIGHT_DASHBOARD_PANEL]: {
      id: AppSettingIDs.RIGHT_DASHBOARD_PANEL,
      type: SETTING_TYPES.SELECT,
      description: "What elements to show on the dashboard?",
      label: "Dashboard Elements",
      value: DASHBOARD_ELEMENTS.SONG,
      options: [
        {
          value: DASHBOARD_ELEMENTS.CALL_STATUS,
          label: "Call Status",
        },
        {
          value: DASHBOARD_ELEMENTS.GUILD_LIST,
          label: "Guild List",
        },
        {
          value: DASHBOARD_ELEMENTS.CHAT,
          label: "Current Chat",
        },
        {
          value: DASHBOARD_ELEMENTS.SHORTCUTS,
          label: "Shortcuts",
        },
        {
          value: DASHBOARD_ELEMENTS.SONG,
          label: "Song",
        },
      ],
    },
    [AppSettingIDs.DASHBOARD_ELEMENTS]: {
      id: AppSettingIDs.DASHBOARD_ELEMENTS,
      type: SETTING_TYPES.MULTISELECT,
      description: "What elements to show on the dashboard?",
      label: "Dashboard Elements",
      value: [
        DASHBOARD_ELEMENTS.CLOCK,
        DASHBOARD_ELEMENTS.NOTIFICATIONS,
        DASHBOARD_ELEMENTS.CALL_CONTROLS,
      ],
      options: [
        {
          value: DASHBOARD_ELEMENTS.CLOCK,
          label: "Corner Clock",
        },
        {
          value: DASHBOARD_ELEMENTS.NOTIFICATIONS,
          label: "Notifications",
        },
        {
          value: DASHBOARD_ELEMENTS.MINI_CALL,
          label: "Mini Call",
        },
        {
          value: DASHBOARD_ELEMENTS.CALL_CONTROLS,
          label: "Call Controls",
        },
      ],
    },
  };
  DeskThing.initSettings(discordSettings);
};

// Updates redirect url, id, and secret from user input from either settings OR from the task
DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (settingData) => {
  const settings = settingData.payload;

  if (!settings) return;

  Object.entries(settings).forEach(([key, setting]) => {
    switch (key) {
      case AppSettingIDs.CLIENT_ID:
        if (setting.type == SETTING_TYPES.STRING) {
          setting.value && StoreProvider.getAuth().setClientId(setting.value);
        }
        break;
      case AppSettingIDs.CLIENT_SECRET:
        if (setting.type == SETTING_TYPES.STRING) {
          setting.value &&
            StoreProvider.getAuth().setClientSecret(setting.value);
        }
        // update discord
        break;
    }
  });
});
