import { create } from "zustand";
import { createDeskThing } from "@deskthing/client";
import { ToClientTypes, ToServerTypes } from "@shared/types/transit";
import { DEVICE_CLIENT } from "@deskthing/types";
import { DiscordSettings } from "@shared/types/discord";
import { validateDiscordSettings } from "@src/utils/settingValidator";

export type Page = "chat" | "browsing" | "call" | "dashboard";

type UIStore = {
  currentPage: Page;
  isLoading: boolean;
  setCurrentPage: (page: Page) => void;

  initialized: boolean;
  initialize: () => void;

  settings: DiscordSettings | null;
  setSettings: (settings: any) => void;
};

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

export const useUIStore = create<UIStore>((set, get) => ({
  currentPage: "dashboard",
  initialized: false,
  isLoading: true,
  settings: null,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Initial fetch for settings
    DeskThing.getSettings().then((settings) => {
      try {
        if (settings) {
          validateDiscordSettings(settings);
          set({ settings, isLoading: false });
        }
      } catch (error) {
        console.error("Error validating settings:", error);
      }
    });

    // Listen for settings updates
    DeskThing.on(DEVICE_CLIENT.SETTINGS, (event) => {
      try {
        if (event?.payload) {
          validateDiscordSettings(event.payload);
          set({ settings: event.payload, isLoading: false });
        }
      } catch (error) {
        console.error("Error validating settings:", error);
      }
    });
  },

  setCurrentPage: (page) => set({ currentPage: page }),

  setSettings: (settings) => set({ settings }),
}));
