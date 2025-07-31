import { create } from "zustand";
import { DeskThing } from "@deskthing/client";
import { AppSettings, DEVICE_CLIENT } from "@deskthing/types";
import { ClockSettings } from "@shared/types";

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

  setCurrentPage: (page: Page) => void;

  initialized: boolean;
  initialize: () => void;

  settings: ClockSettings | null;
  setSettings: (settings: AppSettings | ClockSettings | undefined) => void;
};

export const useUIStore = create<UIStore>((set, get) => ({
  currentPage: "dashboard",
  initialized: false,
  currentTime: 'Loading Time...',
  isLoading: true,
  settings: null,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Initial fetch for settings
    DeskThing.getSettings().then((settings) => {
      get().setSettings(settings)
    });

    // Listen for settings updates
    DeskThing.on(DEVICE_CLIENT.SETTINGS, (event) => {
      get().setSettings(event.payload as ClockSettings)
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
  },

  setSettings: (settings: AppSettings | ClockSettings | undefined) => {
    try {

      if (settings) {
        set({ isLoading: false, settings: settings as ClockSettings });
      }
    } catch (error) {
      console.error("Error validating settings:", error);
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
}));
