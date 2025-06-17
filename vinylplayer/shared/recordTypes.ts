import { AppSettings, SETTING_TYPES } from "@deskthing/types";

export enum DISPLAY_ITEMS {
	ALBUM = "album",
	TITLE = "title",
	ARTISTS = "artists",
	CLOCK = "mini_clock",
	CONTROLS = "controls",
	BG_THUMBNAIL = "bg_thumbnail",
	RECORD_THUMBNAIL = "record_thumbnail",
	// Asserts the bg to be darker and keep the text white
	BG_DARKENED = "bg_darkened",
	CUSTOM_BG = "custom_color",
	CUSTOM_TEXT = "custom_text",
}

export enum CONTROLS {
	PLAY_PAUSE = "play_pause",
	PREVIOUS = "previous",
	NEXT = "next",
	SHUFFLE = "shuffle",
	REPEAT = "repeat",
	VOL_DOWN = "vol_down",
	VOL_UP = "vol_up",

}

export enum RECORD_SIZE {
	SMALL = "small",
	MEDIUM = "medium",
	LARGE = "large",
}

export enum RECORD_OPTIONS {
	TOP = "top",
	MIDDLE = "middle",
	BOTTOM = "bottom",
	LEFT = "left",
	CENTER = "center",
	RIGHT = "right",
}

export enum TEXT_OPTIONS {
	LEFT = "left",
	CENTER = "center",
	RIGHT = "right",
}

// This is all funky TS stuff to assert the settings as what we want

// Adds generics to the setting to assert the value and id
type SettingBase<T extends string, V, O = never> = {
	label: string
	description: string
	id: T
	type: SETTING_TYPES
	value: V
} & (O extends never ? {} : { options: O[] })

// Adds generic to the options to assert the shape
type SelectSetting<T extends string, V> = SettingBase<T, V, { value: V; label: string }>
type MultiSelectSetting<T extends string, V> = SettingBase<T, V[], { value: V; label: string }>

// Defines the app settings to specify what we have
export type RecordSettings = AppSettings & {
	recordSize: SelectSetting<'recordSize', RECORD_SIZE> & { type: SETTING_TYPES.SELECT }
	recordPosX: SelectSetting<'recordPosX', RECORD_OPTIONS> & { type: SETTING_TYPES.SELECT }
	recordPosY: SelectSetting<'recordPosY', RECORD_OPTIONS> & { type: SETTING_TYPES.SELECT }
	display: MultiSelectSetting<'display', DISPLAY_ITEMS> & { type: SETTING_TYPES.MULTISELECT }
	controls: MultiSelectSetting<'controls', CONTROLS> & { type: SETTING_TYPES.MULTISELECT }
	textPos: SelectSetting<'textPos', TEXT_OPTIONS> & { type: SETTING_TYPES.SELECT }
	bgBlur: AppSettings['bgBlur'] & { type: SETTING_TYPES.NUMBER }
	bgColor: AppSettings['bgColor'] & { type: SETTING_TYPES.COLOR }
	textColor: AppSettings['textColor'] & { type: SETTING_TYPES.COLOR }
}