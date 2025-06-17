import { DeskThing } from "@deskthing/server";
import { AppSettings, DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import { DISPLAY_ITEMS, RECORD_SIZE, RECORD_OPTIONS, TEXT_OPTIONS, RecordSettings } from "../shared/recordTypes"

const start = async () => {
	console.log('Server Started!')

	// Use stronger typing for the specific settings here
	const settings: RecordSettings = {
		recordSize: {
			label: "Record Size",
			description: "Size of the record on the screen",
			id: "recordSize",
			type: SETTING_TYPES.SELECT,
			options: [
				{
					value: RECORD_SIZE.SMALL,
					label: "Small",
				},
				{
					value: RECORD_SIZE.MEDIUM,
					label: "Medium",
				},
				{
					value: RECORD_SIZE.LARGE,
					label: "Large",
				}
			],
			value: RECORD_SIZE.LARGE
		},
		recordPosX: {
			label: "Record X Position",
			description: "X Position of the record on the screen",
			id: "recordPosX",
			type: SETTING_TYPES.SELECT,
			options: [
				{
					value: RECORD_OPTIONS.LEFT,
					label: "Left",
				},
				{
					value: RECORD_OPTIONS.CENTER,
					label: "Center",
				},
				{
					value: RECORD_OPTIONS.RIGHT,
					label: "Right",
				}
			],
			value: RECORD_OPTIONS.LEFT
		},
		recordPosY: {
			label: "Record Y Position",
			description: "Y Position of the record on the screen",
			id: "recordPosY",
			type: SETTING_TYPES.SELECT,
			options: [
				{
					value: RECORD_OPTIONS.TOP,
					label: "Top",
				},
				{
					value: RECORD_OPTIONS.MIDDLE,
					label: "Middle",
				},
				{
					value: RECORD_OPTIONS.BOTTOM,
					label: "Bottom",
				}
			],
			value: RECORD_OPTIONS.TOP
		},
		display: {
			label: "UI Elements",
			description: "Select which UI elements to display on the screen",
			id: "display",
			type: SETTING_TYPES.MULTISELECT,
			options: [
				{
					value: DISPLAY_ITEMS.ALBUM,
					label: "Album",
				},
				{
					value: DISPLAY_ITEMS.TITLE,
					label: "Title",
				},
				{
					value: DISPLAY_ITEMS.ARTISTS,
					label: "Artists",
				},
				{
					value: DISPLAY_ITEMS.CLOCK,
					label: "Clock",
				},
				{
					value: DISPLAY_ITEMS.CONTROLS,
					label: "Controls",
				},
				{
					value: DISPLAY_ITEMS.BG_THUMBNAIL,
					label: "Thumbnail Background",
				},
				{
					value: DISPLAY_ITEMS.RECORD_THUMBNAIL,
					label: "Record Thumbnail",
				},
				{
					value: DISPLAY_ITEMS.BG_DARKENED,
					label: "Darken Background",
				},
			],
			value: [
				DISPLAY_ITEMS.ALBUM,
				DISPLAY_ITEMS.TITLE,
				DISPLAY_ITEMS.ARTISTS,
				DISPLAY_ITEMS.CLOCK,
				DISPLAY_ITEMS.CONTROLS,
			]
		},
		textPos: {
			label: "Text Position",
			description: "Position of the text on the screen",
			id: "textPos",
			type: SETTING_TYPES.SELECT,
			options: [
				{
					value: TEXT_OPTIONS.LEFT,
					label: "Left",
				},
				{
					value: TEXT_OPTIONS.CENTER,
					label: "Center",
				},
				{
					value: TEXT_OPTIONS.RIGHT,
					label: "Right",
				}
			],
			value: TEXT_OPTIONS.CENTER
		},
		bgBlur: {
			label: "Background Blur",
			description: "Blur the background thumbnail if applicable",
			id: "bgBlur",
			type: SETTING_TYPES.NUMBER,
			value: 10,
			min: 0,
			max: 100,
		}
	}
	
	DeskThing.initSettings(settings)
};

const stop = async () => {
	// Function called when the server is stopped
	console.log('Server Stopped');
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);