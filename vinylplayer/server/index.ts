import { DeskThing } from '@deskthing/server';
import { AppSettings, SETTING_TYPES } from '@deskthing/types'

const start = async () => {
  initSettings()
}

const initSettings = () => {
  const setting: AppSettings = {
    view: {
      label: "Record View",
      value: 'record',
      id: 'view',
      description: 'Choose the view that you want to be displayed',
      type: SETTING_TYPES.SELECT,
      options: [{ label: 'Default Vinyl', value: 'record' }, { label: 'Fullscreen', value: 'fullscreen' }, { label: 'Record Center', value: 'recordcenter' }]
    }
  }

  DeskThing.initSettings(setting)
}

const stop = async () => {
    // Function called when the server is stopped
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)