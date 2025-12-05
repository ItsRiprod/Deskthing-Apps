import { create } from "zustand";
import { createDeskThing } from "@deskthing/client";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";
import { AppSettings, DEVICE_CLIENT } from "@deskthing/types";
import {
  AppSettingIDs,
  CLOCK_OPTIONS,
  DASHBOARD_ELEMENTS,
  DiscordSettings,
  PANEL_ELEMENTS,
  SONG_CONTROLS,
} from "@shared/types/discord";
import { XL_CONTROL_TOTAL_HEIGHT, XL_CONTROLS_ENABLED } from "@src/constants/xlControls";
import { validateDiscordSettings } from "@src/utils/settingValidator";

export type Page = "chat" | "browsing" | "call" | "dashboard";

export type Dimensions = {
  width: number;
  height: number;
  panel: {
    width: number;
    height: number;
  };
  controls: {
    width: number;
    height: number;
  };
}

type UIStore = {
  currentPage: Page;
  isLoading: boolean;
  currentTime: string;
  leftPanel: PANEL_ELEMENTS
  rightPanel: PANEL_ELEMENTS
  song_controls: SONG_CONTROLS;
  widgets: DASHBOARD_ELEMENTS[]
  clock_options: CLOCK_OPTIONS
  notification_toasts_enabled: boolean
  notification_toast_duration_seconds: number

  dimensions: {
    width: number;
    height: number;
    panel: {
      width: number;
      height: number;
    };
    controls: {
      width: number;
      height: number;
    };
  };

  setCurrentPage: (page: Page) => void;

  initialized: boolean;
  initialize: () => void;

  settings: DiscordSettings | null;
  setSettings: (settings: AppSettings | DiscordSettings | undefined) => void;

  setDimensions: (dimensions: Partial<Dimensions>) => void;

};

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

const defaultWidgets: DASHBOARD_ELEMENTS[] = [];
const baseControlHeight = XL_CONTROLS_ENABLED ? XL_CONTROL_TOTAL_HEIGHT : 75;
const defaultLeftPanel = PANEL_ELEMENTS.GUILD_LIST;
const defaultRightPanel = PANEL_ELEMENTS.BLANK;
const defaultClockOption = CLOCK_OPTIONS.DISABLED;
const defaultSongControls = SONG_CONTROLS.BOTTOM;
const defaultToastEnabled = true;
const defaultToastDuration = 10;

const getInitialDimensions = (): Dimensions => {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
      panel: {
        width: 0,
        height: 0,
      },
      controls: {
        width: 0,
        height: 0,
      },
    };
  }

  const defaultControlsHeight = defaultWidgets.includes(
    DASHBOARD_ELEMENTS.CALL_CONTROLS,
  )
    ? baseControlHeight
    : 0;

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    panel: {
      width: width / 2,
      height: Math.max(height - defaultControlsHeight, 0),
    },
    controls: {
      width,
      height: defaultControlsHeight,
    },
  };
};

let lastSettingsHash = "";

const hashSettings = (settings: AppSettings | DiscordSettings | undefined) => {
  if (!settings) return "";
  // Only hash the fields we actually read to avoid noisy updates.
  const relevant = {
    clock_options: settings[AppSettingIDs.CLOCK_OPTIONS]?.value,
    leftPanel: settings[AppSettingIDs.LEFT_DASHBOARD_PANEL]?.value,
    rightPanel: settings[AppSettingIDs.RIGHT_DASHBOARD_PANEL]?.value,
    widgets: settings[AppSettingIDs.DASHBOARD_ELEMENTS]?.value,
    song_controls: settings[AppSettingIDs.SONG_OPTIONS]?.value,
    notification_toasts_enabled: settings[AppSettingIDs.NOTIFICATION_TOASTS]?.value,
    notification_toast_duration_seconds:
      settings[AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS]?.value,
  };
  return JSON.stringify(relevant);
};

export const useUIStore = create<UIStore>((set, get) => ({
  currentPage: "dashboard",
  initialized: false,
  currentTime: 'Loading Time...',
  isLoading: true,
  settings: null,
  song_controls: SONG_CONTROLS.BOTTOM,
  leftPanel: PANEL_ELEMENTS.GUILD_LIST,
  rightPanel: PANEL_ELEMENTS.BLANK,
  widgets: [...defaultWidgets],
  clock_options: CLOCK_OPTIONS.DISABLED,
  notification_toasts_enabled: defaultToastEnabled,
  notification_toast_duration_seconds: defaultToastDuration,
  dimensions: getInitialDimensions(),

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Initial fetch for settings
    DeskThing.getSettings().then((settings) => {
      get().setSettings(settings)
    });

    DeskThing.send({
      type: DiscordEvents.GET,
      request: 'settings'
    })

    // Listen for settings updates (client channel)
    DeskThing.on(DEVICE_CLIENT.SETTINGS, (event) => {
      get().setSettings(event.payload);
    });

    // Listen for time updates
    DeskThing.on(DEVICE_CLIENT.TIME, (event) => {
      if (typeof event.payload == 'string') {
        set({ currentTime: event.payload });
      } else {
        const utcOffset = event.payload.timezoneOffset;
        const utcTime = event.payload.utcTime;
        const date = new Date(utcTime);
        const amPm = date.getUTCHours() >= 12 ? 'PM' : 'AM';
        date.setMinutes(date.getMinutes() - utcOffset); // current bug - time is inverted
        set({ currentTime: `${date.getUTCHours() % 12 || 12}:${date.getUTCMinutes().toString().padStart(2, '0')} ${amPm}` });
      }
    });

  },

  setSettings: (settings: AppSettings | DiscordSettings | undefined) => {
    try {

      if (settings) {
        // Build a safe settings object by filling missing fields with current state or defaults.
        const safeSettings = {
          [AppSettingIDs.CLOCK_OPTIONS]:
            settings[AppSettingIDs.CLOCK_OPTIONS] ??
            { value: get().clock_options, id: AppSettingIDs.CLOCK_OPTIONS },
          [AppSettingIDs.LEFT_DASHBOARD_PANEL]:
            settings[AppSettingIDs.LEFT_DASHBOARD_PANEL] ??
            { value: get().leftPanel ?? defaultLeftPanel, id: AppSettingIDs.LEFT_DASHBOARD_PANEL },
          [AppSettingIDs.RIGHT_DASHBOARD_PANEL]:
            settings[AppSettingIDs.RIGHT_DASHBOARD_PANEL] ??
            { value: get().rightPanel ?? defaultRightPanel, id: AppSettingIDs.RIGHT_DASHBOARD_PANEL },
          [AppSettingIDs.DASHBOARD_ELEMENTS]:
            settings[AppSettingIDs.DASHBOARD_ELEMENTS] ??
            { value: get().widgets ?? defaultWidgets, id: AppSettingIDs.DASHBOARD_ELEMENTS },
          [AppSettingIDs.SONG_OPTIONS]:
            settings[AppSettingIDs.SONG_OPTIONS] ??
            { value: get().song_controls ?? defaultSongControls, id: AppSettingIDs.SONG_OPTIONS },
          [AppSettingIDs.NOTIFICATION_TOASTS]:
            settings[AppSettingIDs.NOTIFICATION_TOASTS] ??
            {
              value: get().notification_toasts_enabled ?? defaultToastEnabled,
              id: AppSettingIDs.NOTIFICATION_TOASTS,
            },
          [AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS]:
            settings[AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS] ??
            {
              value:
                get().notification_toast_duration_seconds ?? defaultToastDuration,
              id: AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS,
            },
          // Pass through any additional settings untouched.
          ...settings,
        } as DiscordSettings;

        // Skip if nothing changed.
        const nextHash = hashSettings(safeSettings);
        if (nextHash === lastSettingsHash) return;

        // Validate only after defaults applied so missing fields don't throw.
        try {
          validateDiscordSettings(safeSettings);
        } catch (err) {
          console.warn("Settings validation warning (filled defaults):", err);
        }

        set({
          clock_options: safeSettings[AppSettingIDs.CLOCK_OPTIONS].value,
          isLoading: false,
          leftPanel: safeSettings[AppSettingIDs.LEFT_DASHBOARD_PANEL].value,
          rightPanel: safeSettings[AppSettingIDs.RIGHT_DASHBOARD_PANEL].value,
          widgets: safeSettings[AppSettingIDs.DASHBOARD_ELEMENTS].value,
          song_controls: safeSettings[AppSettingIDs.SONG_OPTIONS].value,
          notification_toasts_enabled: safeSettings[AppSettingIDs.NOTIFICATION_TOASTS].value,
          notification_toast_duration_seconds:
            safeSettings[AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS].value,
          settings: safeSettings as DiscordSettings,
        });
        lastSettingsHash = nextHash;
      }
    } catch (error) {
      console.error("Error validating settings:", error);
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),

  setDimensions: (newDimensions) => {
    set(({ dimensions }) => ({
      dimensions: {
        ...dimensions,
        ...newDimensions,
        panel: {
          ...dimensions.panel,
          ...newDimensions.panel,
        },
        controls: {
          ...dimensions.controls,
          ...newDimensions.controls,
        },
      },
    }));
  },
}));
