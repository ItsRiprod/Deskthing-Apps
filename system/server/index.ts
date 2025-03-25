import { createDeskThing } from '@deskthing/server'
import { DESKTHING_EVENTS } from '@deskthing/types';
import { initSettings } from './utilities/initSettings'
import { initListeners } from './utilities/initListeners'

const DeskThing = createDeskThing()

const start = async () => {
  await initSettings()
  await initListeners()
}
// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);
