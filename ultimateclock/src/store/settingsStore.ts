import { create } from "zustand";
import { DeskThing } from "@deskthing/client";
import { DEVICE_CLIENT } from "@deskthing/types";
import { ClockSettingIDs, ClockSettings, CondensedClockSettings } from "@shared/index";
import { getCondensedSettings } from "@src/utils/settingUtils";

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
  fontUrl: string | null

  setCurrentPage: (page: Page) => void;

  initialized: boolean;
  init: () => void;

  updateFontUrl: (fontUrl: string) => void;

  settings: CondensedClockSettings | null;
  setSettings: (settings: ClockSettings | undefined) => void;
};

let currentFontFace: FontFace | null = null;

export const useSettingStore = create<UIStore>((set, get) => ({
  currentPage: "dashboard",
  initialized: false,
  currentTime: 'Loading Time...',
  isLoading: true,
  settings: null,
  fontUrl: null,

  init: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Initial fetch for settings
    DeskThing.getSettings().then((settings) => {
      get().setSettings(settings as ClockSettings)
    });

    // Listen for settings updates
    DeskThing.on(DEVICE_CLIENT.SETTINGS, (event) => {
      get().setSettings(event.payload as ClockSettings)
    });

    // Listen for settings updates
    DeskThing.on(DEVICE_CLIENT.TIME, (event) => {
      const military_time = get().settings?.[ClockSettingIDs.MILITARY_TIME] || false
      const divider = get().settings?.[ClockSettingIDs.CLOCK_DIVIDER] || ':'
      if (typeof event.payload == 'string') {

        if (military_time && event.payload.includes('PM')) {
          // Convert 12-hour format to 24-hour format
          const [time, period] = event.payload.split(' ');
          
          const times = time.split(':').map(Number);
          
          let hours = times[0]
          const minutes = times[1];

          if (period === 'PM' && hours < 12) {
            hours += 12; // Convert PM to 24-hour format
          } else if (period === 'AM' && hours === 12) {
            hours = 0; // Convert 12 AM to 0 hours
          }
          
          const timeString = `${hours.toString().padStart(2, '0')}${divider}${minutes.toString().padStart(2, '0')}`;
          
          set({ currentTime: timeString });

        } else {
          set({ currentTime: event.payload });
        }
      } else {

        const utcOffset = event.payload.timezoneOffset;
        const utcTime = event.payload.utcTime;
        const date = new Date(utcTime);
        date.setMinutes(date.getMinutes() - utcOffset); // current bug - time is inverted

        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();

        let timeString: string;

        if (military_time) {
          // 24-hour format
          timeString = `${hours.toString().padStart(2, '0')}${divider}${minutes.toString().padStart(2, '0')}`;
        } else {
          // 12-hour format
          const amPm = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12;
          timeString = `${hour12}${divider}${minutes.toString().padStart(2, '0')}`;
          timeString += ` ${amPm}`;
        }

        set({ currentTime: timeString });
      }
    });
  },

  setSettings: (settings: ClockSettings | undefined) => {
    try {
      if (settings) {

        const condensedSettings = getCondensedSettings(settings)

        set({ isLoading: false, settings: condensedSettings });

        const fontUrl = get().fontUrl
        const newFontUrl = (settings as ClockSettings)[ClockSettingIDs.FONT_SELECTION]?.value || null;

        if (newFontUrl && typeof newFontUrl === 'string' && newFontUrl !== fontUrl) {
          // font detected that is not the current font
          get().updateFontUrl(newFontUrl);
        }

      }
    } catch (error) {
      console.error("Error validating settings:", error);
    }
  },

  updateFontUrl: async (fontUrl: string | null) => {

    if (fontUrl) {
      try {
        // Load the font file directly from the fonts folder
        const fontName = fontUrl.replace(/\.[^/.]+$/, ""); // Remove extension

        if (currentFontFace) {
          document.fonts.delete(currentFontFace);
        }

        // Create FontFace object
        currentFontFace = new FontFace(
          'CustomClockFont',
          `url(${fontUrl})`
        );

        // Add to document fonts
        document.fonts.add(currentFontFace);
        await currentFontFace.load();

        console.log(`Font loaded: ${fontName}`);

        // Apply font to clock elements
        const clockElements = document.querySelectorAll('.font-clock') as NodeListOf<HTMLElement>;
        clockElements.forEach(element => {
          element.style.fontFamily = "'CustomClockFont', sans-serif";
        });

        console.log('Font loaded successfully:', fontName);

      } catch (error) {
        console.error('Error loading font:', error);
        // Fallback to default
      }
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
}));
