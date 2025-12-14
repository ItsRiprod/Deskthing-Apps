import { createDeskThing } from "@deskthing/server"; // Adjust import as needed
import { DefaultRecorderSettings } from "../../shared/consts/defaultSettings";
import {
  CLIENT_TYPE,
  RECORDER_SETTING_IDS,
  RecorderSettingsType,
  ToClientData,
  ToServerData,
} from "../../shared/index";
import { AppSettings } from "@deskthing/types";
import { join } from "node:path";

const DeskThing = createDeskThing<ToServerData, ToClientData>();

class SettingsStore {
  private static instance: SettingsStore;
  private settings: RecorderSettingsType | null = null;

  private constructor() {}

  public static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  public async init(): Promise<void> {
    try {
      await DeskThing.initSettings(DefaultRecorderSettings);
      const settings = await DeskThing.getSettings();
      if (settings) {
        this.settings = this.normalizeSettings(settings);
      }
    } catch (error) {
      console.error("Failed to initialize settings.", error);
    }

    try {
      DeskThing.on(CLIENT_TYPE.SETTINGS, (data) => {
        console.log("Settings update received from client:", data);
        if (data.request == "set") {
          console.debug("Settings updated from client:", data.payload);
          this.settings = this.normalizeSettings(data.payload);
          DeskThing.setSettings(data.payload);
        }
      });
    } catch (error) {
      console.error("Failed to setup settings listener.", error);
    }

    console.log('SettingsStore initialized');
  }

  private normalizeSettings(settings: AppSettings): RecorderSettingsType {
    const normalized: RecorderSettingsType = Object.fromEntries(
      Object.values(RECORDER_SETTING_IDS).map((key) => {
        const setting = settings[key];
        if (setting && setting.type == DefaultRecorderSettings[key].type) {
          return [key, setting.value];
        } else {
          if (key == RECORDER_SETTING_IDS.SAVE_LOCATION) {
            return [key, join(process.cwd(), "recordings")];
          }

          return [key, DefaultRecorderSettings[key].value];
        }
      })
    ) as RecorderSettingsType;

    return normalized;
  }

  public getSettings(): RecorderSettingsType | null {
    return this.settings;
  }
}

export const settingsStore = SettingsStore.getInstance();
