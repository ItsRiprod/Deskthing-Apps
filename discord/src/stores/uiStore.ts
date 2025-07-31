import { create } from "zustand";
import { createDeskThing } from "@deskthing/client";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";
import { AppSettings, DEVICE_CLIENT } from "@deskthing/types";
import { AppSettingIDs, CLOCK_OPTIONS, DASHBOARD_ELEMENTS, DiscordSettings, PANEL_ELEMENTS, SONG_CONTROLS } from "@shared/types/discord";
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

export const useUIStore = create<UIStore>((set, get) => ({
  currentPage: "dashboard",
  initialized: false,
  currentTime: 'Loading Time...',
  isLoading: true,
  settings: null,
  song_controls: SONG_CONTROLS.BOTTOM,
  leftPanel: PANEL_ELEMENTS.GUILD_LIST,
  rightPanel: PANEL_ELEMENTS.CHAT,
  widgets: [],
  clock_options: CLOCK_OPTIONS.TOP_CENTER,
  dimensions: {
    width: window.innerWidth,
    height: window.innerHeight,
    panel: {
      width: window.innerWidth / 2,
      height: window.innerHeight - 75,
    },
    controls: {
      width: window.innerWidth,
      height: 75,
    }
  },

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

    // Listen for settings updates
    DeskThing.on(DEVICE_CLIENT.SETTINGS, (event) => {
      get().setSettings(event.payload)
    });

    // Listen for settings updates
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

    DeskThing.on(DiscordEvents.SETTINGS, (event) => {
      get().setSettings(event.payload)
    });
  },

  setSettings: (settings: AppSettings | DiscordSettings | undefined) => {
    try {

      if (settings) {
        validateDiscordSettings(settings);
        set({ clock_options: settings[AppSettingIDs.CLOCK_OPTIONS].value, isLoading: false, leftPanel: settings[AppSettingIDs.LEFT_DASHBOARD_PANEL].value, rightPanel: settings[AppSettingIDs.RIGHT_DASHBOARD_PANEL].value, widgets: settings[AppSettingIDs.DASHBOARD_ELEMENTS].value, song_controls: settings[AppSettingIDs.SONG_OPTIONS].value, settings: settings as DiscordSettings });
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
