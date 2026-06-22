import { create } from "zustand";
import { DeskThing } from "@deskthing/client";
import { DEVICE_CLIENT, TimePayload } from "@deskthing/types";
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
};

type UIStore = {
  currentPage: Page;
  isLoading: boolean;
  currentTime: string;
  currentDate: string;
  fontUrl: string | null;

  setCurrentPage: (page: Page) => void;

  initialized: boolean;
  init: () => Promise<void>;

  updateFontUrl: (fontUrl: string | null) => Promise<void>;

  settings: CondensedClockSettings | null;
  setSettings: (settings: ClockSettings | undefined) => void;
};

const getOrdinalSuffix = (day: number): string => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return "st";
  if (mod10 === 2 && mod100 !== 12) return "nd";
  if (mod10 === 3 && mod100 !== 13) return "rd";
  return "th";
};

const formatDate = (date: Date, format: string): string => {
  const dayNum = date.getDate();
  const day = dayNum.toString().padStart(2, "0");
  const suffix = getOrdinalSuffix(dayNum);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const monthNameShort = date.toLocaleString("en-US", { month: "short" });
  const monthNameLong = date.toLocaleString("en-US", { month: "long" });

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MMM DD YYYY":
      return `${monthNameShort} ${dayNum}${suffix} ${year}`;
    case "MMMM DD YYYY":
      return `${monthNameLong} ${dayNum}${suffix} ${year}`;
    case "MM/DD":
      return `${month}/${day}`;
    case "DD/MM":
      return `${day}/${month}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
};

const buildTimeString = (date: Date, military: boolean, divider: string): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (military) {
    return `${hours.toString().padStart(2, "0")}${divider}${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  const hour12 = hours % 12 || 12;
  const amPm = hours >= 12 ? "PM" : "AM";
  return `${hour12}${divider}${minutes.toString().padStart(2, "0")} ${amPm}`;
};

let currentFontFace: FontFace | null = null;

export const useSettingStore = create<UIStore>((set, get) => ({
  currentPage: "dashboard",
  isLoading: true,
  currentTime: "",
  currentDate: "",
  fontUrl: null,
  settings: null,
  initialized: false,

  setCurrentPage: (page: Page) => set({ currentPage: page }),

  init: async () => {
    if (get().initialized) return;

    DeskThing.on(DEVICE_CLIENT.SETTINGS, (data) => {
      if (!data?.payload) return;
      get().setSettings(data.payload as ClockSettings);
    });

    DeskThing.on(DEVICE_CLIENT.TIME, (event) => {
      if (!event?.payload) return;

      const settings = get().settings;
      const military = settings?.[ClockSettingIDs.MILITARY_TIME] ?? false;
      const divider = settings?.[ClockSettingIDs.CLOCK_DIVIDER] || ":";
      const dateFormat = settings?.[ClockSettingIDs.DATE_FORMAT] || "MM/DD/YYYY";

      if (typeof event.payload === "string") {
        set({
          currentTime: event.payload,
          currentDate: formatDate(new Date(), dateFormat),
        });
        return;
      }

      const payload = event.payload as TimePayload;
      const date = new Date(payload.utcTime);
      date.setMinutes(date.getMinutes() - payload.timezoneOffset);

      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      let timeString: string;
      if (military) {
        timeString = `${hours.toString().padStart(2, "0")}${divider}${minutes
          .toString()
          .padStart(2, "0")}`;
      } else {
        const hour12 = hours % 12 || 12;
        const amPm = hours >= 12 ? "PM" : "AM";
        timeString = `${hour12}${divider}${minutes
          .toString()
          .padStart(2, "0")} ${amPm}`;
      }

      const currentDateStr = formatDate(date, dateFormat);
      set({ currentTime: timeString, currentDate: currentDateStr });
    });

    const initialSettings = (await DeskThing.getSettings?.()) as ClockSettings | undefined;
    if (initialSettings) {
      get().setSettings(initialSettings);
    } else {
      set({ isLoading: false });
    }

    const now = new Date();
    const settings = get().settings;
    const military = settings?.[ClockSettingIDs.MILITARY_TIME] ?? false;
    const divider = settings?.[ClockSettingIDs.CLOCK_DIVIDER] || ":";
    const dateFormat = settings?.[ClockSettingIDs.DATE_FORMAT] || "MM/DD/YYYY";
    set({
      currentTime: buildTimeString(now, military, divider),
      currentDate: formatDate(now, dateFormat),
      initialized: true,
    });
  },

  setSettings: (settings: ClockSettings | undefined) => {
    if (!settings) {
      set({ isLoading: false });
      return;
    }

    const condensedSettings = getCondensedSettings(settings);
    set({ isLoading: false, settings: condensedSettings });

    const fontUrl = get().fontUrl;
    const newFontUrl = settings[ClockSettingIDs.FONT_SELECTION]?.value || null;

    if (newFontUrl && typeof newFontUrl === "string" && newFontUrl !== fontUrl) {
      void get().updateFontUrl(newFontUrl);
    }

    const now = new Date();
    const military = condensedSettings[ClockSettingIDs.MILITARY_TIME] ?? false;
    const divider = condensedSettings[ClockSettingIDs.CLOCK_DIVIDER] || ":";
    const dateFormat = condensedSettings[ClockSettingIDs.DATE_FORMAT] || "MM/DD/YYYY";

    set({
      currentTime: buildTimeString(now, military, divider),
      currentDate: formatDate(now, dateFormat),
    });
  },

  updateFontUrl: async (fontUrl: string | null) => {
    if (!fontUrl) return;
    try {
      const fontName = fontUrl.replace(/\.[^/.]+$/, "");

      const candidates: string[] = [];
      if (fontUrl.startsWith("http")) {
        candidates.push(fontUrl);
      } else {
        const clean = fontUrl.replace(/^\//, "");
        candidates.push(clean);
        candidates.push(`fonts/${clean}`);
        candidates.push(`/fonts/${clean}`);
      }

      if (currentFontFace) {
        document.fonts.delete(currentFontFace);
      }

      let loadedFace: FontFace | null = null;
      let lastError: unknown = null;

      for (const src of candidates) {
        try {
          const face = new FontFace("CustomClockFont", `url(${src})`);
          document.fonts.add(face);
          await face.load();
          loadedFace = face;
          console.log(`Clock font loaded: ${fontName} from ${src}`);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!loadedFace) {
        throw lastError || new Error("Failed to load font");
      }

      currentFontFace = loadedFace;

      const styleId = "clock-font-style";
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = ".font-clock, .font-date { font-family: 'CustomClockFont', sans-serif !important; }";
      document.head.appendChild(style);

      const clockElements = document.querySelectorAll('.font-clock, .font-date') as NodeListOf<HTMLElement>;
      clockElements.forEach((element) => {
        element.style.fontFamily = "'CustomClockFont', sans-serif";
      });

      set({ fontUrl });
    } catch (error) {
      console.error("Error loading clock font:", error);
    }
  },
}));
