
import { SettingsBoolean, SettingsColor, SettingsFile, SettingsMultiSelect, SettingsNumber, SettingsRange, SettingsRanked, SettingsSelect, SettingsString } from "@deskthing/types";

export enum ClockWidgets {
  STOPWATCH = 'stopwatch',
  COUNTDOWN = 'countdown',
  DATE = 'date'
}

export enum ClockSettingIDs {
    COLOR_OPTIONS = 'color_options',
    COLOR = 'color',
    FONT = 'font',
    FONT_SELECTION = 'font_selection',
    BACKGROUND = 'background',
    BACKGROUND_BLUR = 'background_blur',
    BACKGROUND_IMAGE = 'background_image',
    BACKGROUND_COLOR = 'background_color',
    BACKGROUND_BRIGHTNESS = 'background_dim',
    MILITARY_TIME = 'military_time',
    CLOCK_POSITION = 'clock_position',
    CLOCK_SIZE = 'clock_size',
    // advanced settings
    CLOCK_OPACITY = 'clock_transparency',
    CLOCK_POS_X = 'clock_pos_x',
    CLOCK_POS_Y = 'clock_pos_y',
    WIDGETS = 'widgets',
    DATE_FORMAT = 'date_format',
    CLOCK_ORDERING = 'clock_ordering',
    CLOCK_JUSTIFY_CONTENT = 'clock_justify_content',
    CLOCK_DIVIDER = 'clock_divider',
    STOPWATCH_DEFAULT_TIME = 'stopwatch_default_time',
    COUNTDOWN_DEFAULT_TIME = 'countdown_default_time',
    GRADIENT_START = 'gradient_start',
    GRADIENT_END = 'gradient_end',
    CLOCK_SHADOW = 'clock_shadow',
    CLOCK_SHADOW_OPACITY = 'clock_shadow_opacity',
    CLOCK_SHADOW_DISTANCE = 'clock_shadow_distance',
    CLOCK_SHADOW_BLUR = 'clock_shadow_blur',
}

export type ClockSettings = {
  [ClockSettingIDs.COLOR_OPTIONS]: SettingsSelect & { id: ClockSettingIDs.COLOR_OPTIONS; value: 'auto' | 'custom'; options: { label: string; value: 'auto' | 'custom' | 'gradient' }[] };
  [ClockSettingIDs.COLOR]: SettingsColor & { id: ClockSettingIDs.COLOR };
  [ClockSettingIDs.FONT]: SettingsFile & { id: ClockSettingIDs.FONT };
  [ClockSettingIDs.FONT_SELECTION]: SettingsSelect & { id: ClockSettingIDs.FONT_SELECTION };
  [ClockSettingIDs.BACKGROUND]: SettingsSelect & { id: ClockSettingIDs.BACKGROUND };
  [ClockSettingIDs.BACKGROUND_BLUR]: SettingsNumber & { id: ClockSettingIDs.BACKGROUND_BLUR };
  [ClockSettingIDs.BACKGROUND_IMAGE]: SettingsFile & { id: ClockSettingIDs.BACKGROUND_IMAGE };
  [ClockSettingIDs.BACKGROUND_COLOR]: SettingsColor & { id: ClockSettingIDs.BACKGROUND_COLOR };
  [ClockSettingIDs.BACKGROUND_BRIGHTNESS]: SettingsRange & { id: ClockSettingIDs.BACKGROUND_BRIGHTNESS };
  [ClockSettingIDs.MILITARY_TIME]: SettingsBoolean & { id: ClockSettingIDs.MILITARY_TIME };
  [ClockSettingIDs.CLOCK_POSITION]: SettingsSelect & { id: ClockSettingIDs.CLOCK_POSITION };
  [ClockSettingIDs.CLOCK_SIZE]: SettingsNumber & { id: ClockSettingIDs.CLOCK_SIZE };
  // advanced settings
  [ClockSettingIDs.CLOCK_OPACITY]: SettingsRange & { id: ClockSettingIDs.CLOCK_OPACITY };
  [ClockSettingIDs.CLOCK_POS_X]: SettingsNumber & { id: ClockSettingIDs.CLOCK_POS_X };
  [ClockSettingIDs.CLOCK_POS_Y]: SettingsNumber & { id: ClockSettingIDs.CLOCK_POS_Y };

  // widget settings enable/disable dynamically based on the widget selected 
  [ClockSettingIDs.WIDGETS]: SettingsMultiSelect & { id: ClockSettingIDs.WIDGETS };
  [ClockSettingIDs.DATE_FORMAT]: SettingsSelect & { id: ClockSettingIDs.DATE_FORMAT };
  [ClockSettingIDs.CLOCK_ORDERING]: SettingsRanked & { id: ClockSettingIDs.CLOCK_ORDERING };
  [ClockSettingIDs.CLOCK_JUSTIFY_CONTENT]: SettingsSelect & { id: ClockSettingIDs.CLOCK_JUSTIFY_CONTENT };
  [ClockSettingIDs.CLOCK_DIVIDER]: SettingsString & { id: ClockSettingIDs.CLOCK_DIVIDER; };
  [ClockSettingIDs.STOPWATCH_DEFAULT_TIME]: SettingsNumber & { id: ClockSettingIDs.STOPWATCH_DEFAULT_TIME };
  [ClockSettingIDs.COUNTDOWN_DEFAULT_TIME]: SettingsNumber & { id: ClockSettingIDs.COUNTDOWN_DEFAULT_TIME };
  [ClockSettingIDs.GRADIENT_START]: SettingsColor & { id: ClockSettingIDs.GRADIENT_START };
  [ClockSettingIDs.GRADIENT_END]: SettingsColor & { id: ClockSettingIDs.GRADIENT_END };
  [ClockSettingIDs.CLOCK_SHADOW]: SettingsBoolean & { id: ClockSettingIDs.CLOCK_SHADOW };
  [ClockSettingIDs.CLOCK_SHADOW_OPACITY]: SettingsRange & { id: ClockSettingIDs.CLOCK_SHADOW_OPACITY };
  [ClockSettingIDs.CLOCK_SHADOW_DISTANCE]: SettingsRange & { id: ClockSettingIDs.CLOCK_SHADOW_DISTANCE };
  [ClockSettingIDs.CLOCK_SHADOW_BLUR]: SettingsRange & { id: ClockSettingIDs.CLOCK_SHADOW_BLUR };
};

export type CondensedClockSettings<K extends ClockSettingIDs = ClockSettingIDs> = {
  [P in K]: ClockSettings[P]['value']
}