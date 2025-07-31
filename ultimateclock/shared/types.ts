
import { SettingsColor, SettingsFile, SettingsSelect } from "@deskthing/types";

export enum ClockSettingIDs {
    COLOR_OPTIONS = 'color_options',
    COLOR = 'color',
    FONT = 'font',
    BACKGROUND = 'background'
}

export type ClockSettings = {
  [ClockSettingIDs.COLOR_OPTIONS]: SettingsSelect & { id: ClockSettingIDs.COLOR_OPTIONS; value: 'auto' | 'custom'; options: { label: string; value: 'auto' | 'custom' }[] };
  [ClockSettingIDs.COLOR]: SettingsColor & { id: ClockSettingIDs.COLOR };
  [ClockSettingIDs.FONT]: SettingsFile & { id: ClockSettingIDs.FONT };
  [ClockSettingIDs.BACKGROUND]: SettingsSelect & { id: ClockSettingIDs.BACKGROUND };
};