import { SETTING_TYPES } from '@deskthing/types'
import { ClockSettings, ClockSettingIDs } from '../shared/types'
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
        { label: 'Custom', value: 'custom' }
      ]
    },
    [ClockSettingIDs.COLOR]: {
      id: ClockSettingIDs.COLOR,
      type: SETTING_TYPES.COLOR,
      label: 'Clock Color',
      value: '#ffffff', // default color, adjust as needed
    },
    [ClockSettingIDs.FONT]: {
      id: ClockSettingIDs.FONT,
      type: SETTING_TYPES.FILE,
      label: 'Clock Font',
      value: '', // default font file path or name
      fileTypes: [
        {
          name: 'Font Files',
          extensions: ['ttf', 'otf', 'woff', 'woff2'] //
        }
      ]
    },
    [ClockSettingIDs.BACKGROUND]: {
      id: ClockSettingIDs.BACKGROUND,
      type: SETTING_TYPES.SELECT,
      value: 'default', // adjust as needed
      label: 'Background Options',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' }
      ]
    } 
  }

  await DeskThing.initSettings(settings)
}