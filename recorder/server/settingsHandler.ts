import { DeskThing } from '@deskthing/server'; // Adjust import as needed
import { DefaultRecorderSettings } from './consts/defaultSettings';
import { RECORDER_SETTING_IDS, RecorderSettingsType } from '../shared/types';
import { AppSettings } from '@deskthing/types';

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
      console.error('Failed to initialize settings.', error);
    }
  }

  private normalizeSettings(settings: AppSettings): RecorderSettingsType {
    const normalized: RecorderSettingsType = Object.fromEntries(Object.values(RECORDER_SETTING_IDS).map((key) => {
      const setting = settings[key];
      if (setting && setting.type == DefaultRecorderSettings[key].type) {
        return [key, setting.value];
      } else {
        return [key, DefaultRecorderSettings[key].value];
      }
    })) as RecorderSettingsType;

    return normalized;
  }

  public getSettings(): RecorderSettingsType | null {
    return this.settings;
  }
}

export const settingsStore = SettingsStore.getInstance();