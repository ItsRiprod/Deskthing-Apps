import { SETTING_TYPES } from '@deskthing/types'
import { ClockSettings, ClockSettingIDs, ClockWidgets } from '../shared/settings'
import { DeskThing } from '@deskthing/server'

export const initializeSettings = async (): Promise<void> => {

  const settings: ClockSettings = {
    [ClockSettingIDs.COLOR_OPTIONS]: {
      id: ClockSettingIDs.COLOR_OPTIONS,
      type: SETTING_TYPES.SELECT,
      value: 'auto',
      label: 'Clock Color Options',
      options: [
        { label: 'Automatic', value: 'auto' },
        { label: 'Custom', value: 'custom' },
        { label: 'Gradient', value: 'gradient' }
      ]
    },
    [ClockSettingIDs.COLOR]: {
      id: ClockSettingIDs.COLOR,
      type: SETTING_TYPES.COLOR,
      label: 'Clock Color',
      value: '#ffffff',
      dependsOn: [
        {
          settingId: ClockSettingIDs.COLOR_OPTIONS,
          isValue: 'custom'
        }
      ]
    },
    [ClockSettingIDs.GRADIENT_START]: {
      id: ClockSettingIDs.GRADIENT_START,
      type: SETTING_TYPES.COLOR,
      label: 'Gradient Start Color',
      value: '#ff0000',
      dependsOn: [
        {
          settingId: ClockSettingIDs.COLOR_OPTIONS,
          isValue: 'gradient'
        }
      ]
    },
    [ClockSettingIDs.GRADIENT_END]: {
      id: ClockSettingIDs.GRADIENT_END,
      type: SETTING_TYPES.COLOR,
      label: 'Gradient End Color',
      value: '#0000ff',
      dependsOn: [
        {
          settingId: ClockSettingIDs.COLOR_OPTIONS,
          isValue: 'gradient'
        }
      ]
    },
    [ClockSettingIDs.CLOCK_SIZE]: {
      id: ClockSettingIDs.CLOCK_SIZE,
      type: SETTING_TYPES.NUMBER,
      label: 'Clock Size (px)',
      value: 180,
      min: 5,
      max: 500,
      step: 1,
      description: 'Adjust the size of the clock display font in pixels'
    },
    [ClockSettingIDs.CLOCK_OPACITY]: {
      id: ClockSettingIDs.CLOCK_OPACITY,
      type: SETTING_TYPES.RANGE,
      label: 'Clock Opacity',
      value: 1,
      min: 0,
      max: 1,
      step: 0.01
    },
    [ClockSettingIDs.CLOCK_DIVIDER]: {
      id: ClockSettingIDs.CLOCK_DIVIDER,
      type: SETTING_TYPES.STRING,
      label: 'Clock Divider',
      value: ':',
      description: 'Character used to separate time components (e.g., hours, minutes, seconds).'
    },
    [ClockSettingIDs.MILITARY_TIME]: {
      id: ClockSettingIDs.MILITARY_TIME,
      type: SETTING_TYPES.BOOLEAN,
      label: 'Military Time',
      value: false
    },
    [ClockSettingIDs.FONT]: {
      id: ClockSettingIDs.FONT,
      type: SETTING_TYPES.FILE,
      label: 'Upload Font',
      value: '',
      description: 'Upload a custom font for the clock display. Hit Save after uploading then select it in FONT SELECTION',
      fileTypes: [
        {
          name: 'Font Files',
          extensions: ['ttf', 'otf', 'woff', 'woff2']
        }
      ]
    },
    [ClockSettingIDs.FONT_SELECTION]: {
      id: ClockSettingIDs.FONT_SELECTION,
      type: SETTING_TYPES.SELECT,
      label: 'Select Font',
      value: '',
      description: 'Select a font for the clock display. If you upload a new font, select it here.',
      options: [
        {
          label: 'GeistVF (Default)',
          value: 'GeistVF.ttf'
        }
      ]
    },
    [ClockSettingIDs.BACKGROUND]: {
      id: ClockSettingIDs.BACKGROUND,
      type: SETTING_TYPES.SELECT,
      value: 'color',
      label: 'Background Options',
      options: [
        { label: 'Color', value: 'color' },
        { label: 'Picture', value: 'picture' },
        { label: 'Thumbnail', value: 'thumbnail' }
      ]
    },
    [ClockSettingIDs.BACKGROUND_BLUR]: {
      id: ClockSettingIDs.BACKGROUND_BLUR,
      type: SETTING_TYPES.NUMBER,
      label: 'Background Blur',
      description: 'Adjust the blur effect on the background. Only applies to thumbnail backgrounds.',
      value: 12,
      min: 0,
      max: 100,
      step: 0.1,
      dependsOn: [
        {
          settingId: ClockSettingIDs.BACKGROUND,
          isNot: 'color'
        },
      ]
    },
    [ClockSettingIDs.BACKGROUND_IMAGE]: {
      id: ClockSettingIDs.BACKGROUND_IMAGE,
      type: SETTING_TYPES.FILE,
      label: 'Background Image',
      value: '',
      description: 'Upload a custom background image.',
      fileTypes: [
        {
          name: 'Image Files',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif']
        }
      ],
      dependsOn: [
        {
          settingId: ClockSettingIDs.BACKGROUND,
          isValue: 'picture'
        }
      ]
    },
    [ClockSettingIDs.BACKGROUND_COLOR]: {
      id: ClockSettingIDs.BACKGROUND_COLOR,
      type: SETTING_TYPES.COLOR,
      label: 'Background Color',
      value: '#1A2232',
      dependsOn: [
        {
          settingId: ClockSettingIDs.BACKGROUND,
          isValue: 'color'
        }
      ]
    },
    [ClockSettingIDs.BACKGROUND_BRIGHTNESS]: {
      id: ClockSettingIDs.BACKGROUND_BRIGHTNESS,
      version: '0.11.3', // set version so it updates if someone improperly downloaded this 
      type: SETTING_TYPES.RANGE,
      label: 'Background Brightness',
      description: 'Adjust the brightness of the background.',
      value: 1,
      min: 0,
      max: 1,
      step: 0.01
    },
    [ClockSettingIDs.CLOCK_POSITION]: {
      id: ClockSettingIDs.CLOCK_POSITION,
      type: SETTING_TYPES.SELECT,
      label: 'Clock Position',
      description: 'Set the position of the clock on the screen.',
      options: [
        { label: 'Top Left', value: 'top-left' },
        { label: 'Top Right', value: 'top-right' },
        { label: 'Bottom Left', value: 'bottom-left' },
        { label: 'Bottom Right', value: 'bottom-right' },
        { label: 'Top', value: 'top' },
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
        { label: 'Bottom', value: 'bottom' },
        { label: 'Center', value: 'center' }
      ],
      value: 'center'
    },
    [ClockSettingIDs.CLOCK_POS_X]: {
      id: ClockSettingIDs.CLOCK_POS_X,
      type: SETTING_TYPES.NUMBER,
      label: 'Clock X Position',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
    },
    [ClockSettingIDs.CLOCK_POS_Y]: {
      id: ClockSettingIDs.CLOCK_POS_Y,
      type: SETTING_TYPES.NUMBER,
      label: 'Clock Y Position',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
    },
    [ClockSettingIDs.WIDGETS]: {
      id: ClockSettingIDs.WIDGETS,
      type: SETTING_TYPES.MULTISELECT,
      label: 'Widgets',
      value: [ClockWidgets.DATE],
      options: [
        { label: 'Stopwatch', value: ClockWidgets.STOPWATCH },
        { label: 'Countdown', value: ClockWidgets.COUNTDOWN },
        { label: 'Date', value: ClockWidgets.DATE }
      ]
    },
    [ClockSettingIDs.DATE_FORMAT]: {
      id: ClockSettingIDs.DATE_FORMAT,
      type: SETTING_TYPES.SELECT,
      label: 'Date Format',
      value: 'MM/DD/YYYY',
      options: [
        { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
        { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
        { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
      ],
      dependsOn: [
        {
          settingId: ClockSettingIDs.WIDGETS,
          isValue: 'date'
        }
      ]
    },
    [ClockSettingIDs.STOPWATCH_DEFAULT_TIME]: {
      id: ClockSettingIDs.STOPWATCH_DEFAULT_TIME,
      type: SETTING_TYPES.NUMBER,
      label: 'Stopwatch Default Time',
      value: 0,
      min: 0,
      max: 86400,
      step: 1,
      dependsOn: [
        {
          settingId: ClockSettingIDs.WIDGETS,
          isValue: 'stopwatch'
        }
      ]
    },
    [ClockSettingIDs.COUNTDOWN_DEFAULT_TIME]: {
      id: ClockSettingIDs.COUNTDOWN_DEFAULT_TIME,
      type: SETTING_TYPES.NUMBER,
      label: 'Countdown Default Time',
      value: 60,
      min: 1,
      max: 86400,
      step: 1,
      dependsOn: [
        {
          settingId: ClockSettingIDs.WIDGETS,
          isValue: 'countdown'
        }
      ]
    },
    [ClockSettingIDs.CLOCK_ORDERING]: {
      id: ClockSettingIDs.CLOCK_ORDERING,
      type: SETTING_TYPES.RANKED,
      label: 'Clock Ordering',
      value: ['clock', ClockWidgets.DATE, ClockWidgets.STOPWATCH, ClockWidgets.COUNTDOWN],
      options: [
        { label: 'Clock', value: 'clock' },
        { label: 'Date', value: ClockWidgets.DATE },
        { label: 'Stopwatch', value: ClockWidgets.STOPWATCH },
        { label: 'Countdown', value: ClockWidgets.COUNTDOWN }
      ],
    },
    [ClockSettingIDs.CLOCK_JUSTIFY_CONTENT]: {
      id: ClockSettingIDs.CLOCK_JUSTIFY_CONTENT,
      type: SETTING_TYPES.SELECT,
      label: 'Clock Justify Content',
      value: 'center',
      options: [
        { label: 'Start', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'flex-end' },
        { label: 'Space Between', value: 'space-between' }
      ]
    },
    [ClockSettingIDs.CLOCK_SHADOW]: {
      id: ClockSettingIDs.CLOCK_SHADOW,
      type: SETTING_TYPES.BOOLEAN,
      label: 'Clock Shadow',
      value: true,
      description: 'Enable or disable shadow effect on the clock text.'
    },
    [ClockSettingIDs.CLOCK_SHADOW_OPACITY]: {
      id: ClockSettingIDs.CLOCK_SHADOW_OPACITY,
      type: SETTING_TYPES.RANGE,
      label: 'Clock Shadow Opacity',
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      dependsOn: [
        {
          settingId: ClockSettingIDs.CLOCK_SHADOW,
        }
      ]
    },
    [ClockSettingIDs.CLOCK_SHADOW_DISTANCE]: {
      id: ClockSettingIDs.CLOCK_SHADOW_DISTANCE,
      type: SETTING_TYPES.RANGE,
      label: 'Clock Shadow Distance',
      value: 2,
      min: 0,
      max: 10,
      step: 0.1,
      dependsOn: [
        {
          settingId: ClockSettingIDs.CLOCK_SHADOW,
        }
      ]
    },
    [ClockSettingIDs.CLOCK_SHADOW_BLUR]: {
      id: ClockSettingIDs.CLOCK_SHADOW_BLUR,
      type: SETTING_TYPES.RANGE,
      label: 'Clock Shadow Blur',
      value: 4,
      min: 0,
      max: 20,
      step: 0.1,
      dependsOn: [
        {
          settingId: ClockSettingIDs.CLOCK_SHADOW,
        }
      ]
    }
  }

  await DeskThing.initSettings(settings)
}