import { createDeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import {
  AppSettingIDs,
  CLOCK_OPTIONS,
  CONTROL_OPTIONS,
  CONTROL_POSITION,
  CONTROL_SIZE,
  DASHBOARD_ELEMENTS,
  DiscordSettings,
  PANEL_ELEMENTS,
  SONG_CONTROLS,
} from "../shared/types/discord";
import StoreProvider from "./storeProvider";
import {
  DiscordEvents,
  ToClientTypes,
  ToServerTypes,
} from "../shared/types/transit";

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>();

const fontSizeSetting = (id: AppSettingIDs, label: string, value: number) => ({
  id,
  type: SETTING_TYPES.NUMBER,
  version: "0.2.0",
  description: `${label} font size (px)`,
  label,
  value,
  min: 10,
  max: 28,
});

export const setupSettings = () => {
  const discordSettings: DiscordSettings = {
    [AppSettingIDs.CLIENT_ID]: {
      id: AppSettingIDs.CLIENT_ID,
      type: SETTING_TYPES.STRING,
      version: "0.11.4",
      description: "Discord Client ID",
      label: "Client ID",
      value: "",
    },
    [AppSettingIDs.CLIENT_SECRET]: {
      id: AppSettingIDs.CLIENT_SECRET,
      type: SETTING_TYPES.STRING,
      version: "0.11.4",
      description: "Client Secret Code",
      label: "Client Secret",
      value: "",
    },
    [AppSettingIDs.REDIRECT_URL]: {
      id: AppSettingIDs.REDIRECT_URL,
      type: SETTING_TYPES.STRING,
      version: "0.11.4",
      description: "Set the Redirect URL for the Discord Application. It MUST be localhost!",
      label: "Redirect URL",
      value: "http://localhost:8888/callback/discord",
    },
    // [AppSettingIDs.RICH_PRESENCE]: {
    //   id: AppSettingIDs.RICH_PRESENCE,
    //   type: SETTING_TYPES.BOOLEAN,
    //   version: "0.11.4",
    //   description: "Enable Rich Presence (Currently buggy and doesn't always work)",
    //   label: "Rich Presence",
    //   value: true,
    // },
    // [AppSettingIDs.SET_MAIN_TEXT]: {
    //   id: AppSettingIDs.SET_MAIN_TEXT,
    //   type: SETTING_TYPES.STRING,
    //   version: "0.11.4",
    //   description: "Main Text (Currently buggy and doesn't always work)",
    //   label: "Rich Presence Main Text",
    //   value: "",
    //   dependsOn: [
    //     {
    //       settingId: AppSettingIDs.RICH_PRESENCE,
    //     },
    //   ],
    // },
    // [AppSettingIDs.SET_SECONDARY_TEXT]: {
    //   id: AppSettingIDs.SET_SECONDARY_TEXT,
    //   type: SETTING_TYPES.STRING,
    //   version: "0.11.4",
    //   description: "Secondary Text (Currently buggy and doesn't always work)",
    //   label: "Rich Presence Secondary Text",
    //   value: "",
    //   dependsOn: [
    //     {
    //       settingId: AppSettingIDs.RICH_PRESENCE,
    //     },
    //   ],
    // },
    // [AppSettingIDs.HAVE_TIMER]: {
    //   id: AppSettingIDs.HAVE_TIMER,
    //   type: SETTING_TYPES.BOOLEAN,
    //   version: "0.11.4",
    //   description: "Include timer with Rich Presence? (Currently buggy and doesn't always work)",
    //   label: "Rich Presence Timer",
    //   value: true,
    //   dependsOn: [
    //     {
    //       settingId: AppSettingIDs.RICH_PRESENCE,
    //     },
    //   ],
    // },
    [AppSettingIDs.LEFT_DASHBOARD_PANEL]: {
      id: AppSettingIDs.LEFT_DASHBOARD_PANEL,
      type: SETTING_TYPES.SELECT,
      version: "0.11.6",
      description: "What elements to show on the dashboard?",
      label: "Left Panel",
      value: PANEL_ELEMENTS.CALL_STATUS,
      options: [
        {
          value: PANEL_ELEMENTS.CALL_STATUS,
          label: "Call Status",
        },
        {
          value: PANEL_ELEMENTS.CHAT,
          label: "Current Chat",
        },
        {
          value: PANEL_ELEMENTS.SONG,
          label: "Song",
        },
        {
          value: PANEL_ELEMENTS.CLOCK,
          label: "Clock",
        },
        {
          value: PANEL_ELEMENTS.BLANK,
          label: "Nothing",
        },
      ],
    },
    [AppSettingIDs.RIGHT_DASHBOARD_PANEL]: {
      id: AppSettingIDs.RIGHT_DASHBOARD_PANEL,
      type: SETTING_TYPES.SELECT,
      version: "0.11.6",
      description: "What elements to show on the dashboard?",
      label: "Right Panel",
      value: PANEL_ELEMENTS.BLANK,
      options: [
        {
          value: PANEL_ELEMENTS.CALL_STATUS,
          label: "Call Status",
        },
        {
          value: PANEL_ELEMENTS.CHAT,
          label: "Current Chat",
        },
        {
          value: PANEL_ELEMENTS.SONG,
          label: "Song",
        },
        {
          value: PANEL_ELEMENTS.CLOCK,
          label: "Clock",
        },
        {
          value: PANEL_ELEMENTS.BLANK,
          label: "Nothing",
        },
      ],
    },
    [AppSettingIDs.DASHBOARD_ELEMENTS]: {
      id: AppSettingIDs.DASHBOARD_ELEMENTS,
      type: SETTING_TYPES.MULTISELECT,
      version: "0.11.4",
      description: "What elements to show on the dashboard?",
      label: "Dashboard Elements",
      value: [
        DASHBOARD_ELEMENTS.CALL_CONTROLS,
      ],
      options: [
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
        {
          value: DASHBOARD_ELEMENTS.BG_ALBUM,
          label: "Background Album",
        },
      ],
    },
    [AppSettingIDs.SCROLL_TO_BOTTOM]: {
      id: AppSettingIDs.SCROLL_TO_BOTTOM,
      type: SETTING_TYPES.BOOLEAN,
      version: "0.11.4",
      description: "Scroll to bottom of chat automatically",
      label: "Scroll to Bottom",
      value: true,
      dependsOn: [
        {
          settingId: AppSettingIDs.LEFT_DASHBOARD_PANEL,
          isValue: PANEL_ELEMENTS.CHAT,
        },
        {
          settingId: AppSettingIDs.RIGHT_DASHBOARD_PANEL,
          isValue: PANEL_ELEMENTS.CHAT,
        },
      ],
    },
    [AppSettingIDs.NOTIFICATION_TOASTS]: {
      id: AppSettingIDs.NOTIFICATION_TOASTS,
      type: SETTING_TYPES.BOOLEAN,
      version: "0.11.10",
      description: "Show Discord notifications as DeskThing toasts",
      label: "Notification Toasts",
      value: true,
    },
    [AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS]: {
      id: AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS,
      type: SETTING_TYPES.NUMBER,
      version: "0.11.14",
      description: "How long notification toasts stay visible (in seconds)",
      label: "Notification Toast Duration",
      value: 10,
      min: 1,
      max: 60,
    },
    [AppSettingIDs.CONTROLS_ORDER]: {
      id: AppSettingIDs.CONTROLS_ORDER,
      type: SETTING_TYPES.RANKED,
      version: "0.11.4",
      description: "The order of the call controls (appears only while you're in a call)",
      label: "Call Controls Order",
      value: [CONTROL_OPTIONS.MUTE, CONTROL_OPTIONS.DEAFEN, CONTROL_OPTIONS.DISCONNECT],
      options: [
        {
          value: CONTROL_OPTIONS.MUTE,
          label: "Mute",
        },
        {
          value: CONTROL_OPTIONS.DEAFEN,
          label: "Deafen",
        },
        {
          value: CONTROL_OPTIONS.DISCONNECT,
          label: "Disconnect",
        }
      ],
      dependsOn: [
        {
          settingId: AppSettingIDs.DASHBOARD_ELEMENTS,
          isValue: DASHBOARD_ELEMENTS.CALL_CONTROLS,
        }
      ],
    },
    [AppSettingIDs.CONTROLS_SIZE]: {
      id: AppSettingIDs.CONTROLS_SIZE,
      type: SETTING_TYPES.SELECT,
      version: "0.2.0",
      description: "Size of the call controls widget (only appears while you're in a call)",
      label: "Call Controls Size",
      value: CONTROL_SIZE.MEDIUM,
      options: [
        { value: CONTROL_SIZE.SMALL, label: "Small" },
        { value: CONTROL_SIZE.MEDIUM, label: "Medium" },
        { value: CONTROL_SIZE.LARGE, label: "Large" },
      ],
      dependsOn: [
        {
          settingId: AppSettingIDs.DASHBOARD_ELEMENTS,
          isValue: DASHBOARD_ELEMENTS.CALL_CONTROLS,
        }
      ],
    },
    [AppSettingIDs.CONTROLS_POSITION]: {
      id: AppSettingIDs.CONTROLS_POSITION,
      type: SETTING_TYPES.SELECT,
      version: "0.2.0",
      description: "Position of the call controls widget (only appears while you're in a call)",
      label: "Call Controls Position",
      value: CONTROL_POSITION.TOP,
      options: [
        { value: CONTROL_POSITION.TOP, label: "Top" },
        { value: CONTROL_POSITION.BOTTOM, label: "Bottom" },
      ],
      dependsOn: [
        {
          settingId: AppSettingIDs.DASHBOARD_ELEMENTS,
          isValue: DASHBOARD_ELEMENTS.CALL_CONTROLS,
        }
      ],
    },
    [AppSettingIDs.SPEAKING_COLOR]: {
      id: AppSettingIDs.SPEAKING_COLOR,
      type: SETTING_TYPES.COLOR,
      version: "0.11.4",
      description: "The color of the speaking indicator",
      label: "Speaking Color",
      value: "#00FF00", // Default green color
      dependsOn: [
        {
          settingId: AppSettingIDs.DASHBOARD_ELEMENTS,
          isValue: DASHBOARD_ELEMENTS.MINI_CALL,
        },
        {
          settingId: AppSettingIDs.LEFT_DASHBOARD_PANEL,
          isValue: PANEL_ELEMENTS.CALL_STATUS,
        },
        {
          settingId: AppSettingIDs.RIGHT_DASHBOARD_PANEL,
          isValue: PANEL_ELEMENTS.CALL_STATUS,
        },
      ],
    },
    [AppSettingIDs.CLOCK_OPTIONS]: {
      id: AppSettingIDs.CLOCK_OPTIONS,
      type: SETTING_TYPES.SELECT,
      version: "0.11.4",
      description: "The position of the clock widget",
      label: "Clock Widget Position",
      value: CLOCK_OPTIONS.DISABLED,
      options: [
        {
          value: CLOCK_OPTIONS.TOP_LEFT,
          label: "Top Left",
        },
        {
          value: CLOCK_OPTIONS.TOP_RIGHT,
          label: "Top Right",
        },
        {
          value: CLOCK_OPTIONS.TOP_CENTER,
          label: "Top Center",
        },
        {
          value: CLOCK_OPTIONS.CUSTOM,
          label: "Custom Position",
        },
        {
          value: CLOCK_OPTIONS.DISABLED,
          label: "Disabled",
        }
      ]
    },
    [AppSettingIDs.SONG_OPTIONS]: {
      id: AppSettingIDs.SONG_OPTIONS,
      type: SETTING_TYPES.SELECT,
      version: "0.11.4",
      description: "The position of the song widget",
      label: "Song Widget Position",
      value: SONG_CONTROLS.BOTTOM,
      options: [
        {
          value: SONG_CONTROLS.DISABLED,
          label: "Disabled",
        },
        {
          value: SONG_CONTROLS.FREE,
          label: "Free Position",
        },
        {
          value: SONG_CONTROLS.TOP,
          label: "Top Position",
        },
        {
          value: SONG_CONTROLS.BOTTOM,
          label: "Bottom Position",
        }
      ],
      dependsOn: [
        {
          settingId: AppSettingIDs.LEFT_DASHBOARD_PANEL,
          isValue: PANEL_ELEMENTS.SONG,
        },
        {
          settingId: AppSettingIDs.RIGHT_DASHBOARD_PANEL,
          isValue: PANEL_ELEMENTS.SONG,
        },
      ]
    },
    [AppSettingIDs.PANEL_SPLIT_RATIO]: {
      id: AppSettingIDs.PANEL_SPLIT_RATIO,
      type: SETTING_TYPES.NUMBER,
      version: "0.2.1",
      description: "How much space the left panel takes (only applies while both panels are shown)",
      label: "Panel Split Ratio (%)",
      value: 50,
      min: 20,
      max: 80,
      step: 1,
    },
    [AppSettingIDs.CHAT_USERNAME_FONT_SIZE]: fontSizeSetting(
      AppSettingIDs.CHAT_USERNAME_FONT_SIZE,
      "Chat Username Font Size",
      17,
    ),
    [AppSettingIDs.CHAT_TIMESTAMP_FONT_SIZE]: fontSizeSetting(
      AppSettingIDs.CHAT_TIMESTAMP_FONT_SIZE,
      "Chat Timestamp Font Size",
      17,
    ),
    [AppSettingIDs.CHAT_MESSAGE_FONT_SIZE]: fontSizeSetting(
      AppSettingIDs.CHAT_MESSAGE_FONT_SIZE,
      "Chat Message Font Size",
      19,
    ),
    [AppSettingIDs.CALL_REFRESH_BUTTON]: {
      id: AppSettingIDs.CALL_REFRESH_BUTTON,
      type: SETTING_TYPES.BOOLEAN,
      version: "0.2.1",
      description: "Show manual refresh button on the call participants panel",
      label: "Show Call Refresh Button",
      value: false,
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

  DeskThing.send({
    type: DiscordEvents.SETTINGS,
    request: "set",
    payload: settings as DiscordSettings,
  });
});
