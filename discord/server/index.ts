import { DeskThing } from '@deskthing/server';
import { DESKTHING_EVENTS } from '@deskthing/types';
import dotenv from 'dotenv'
dotenv.config()

DeskThing.on(DESKTHING_EVENTS.START, async () => {

  // Avoids importing any code prior to deskthing being initialized

  const { setupTasks } = await import('./setupTasks');
  const { setupSettings } = await import('./setupSettings');
  const { setupActions } = await import('./setupActions');
  const { initializeDiscord } = await import('./initializers');

  setupTasks()
  setupSettings()
  setupActions()
  initializeDiscord()
})


DeskThing.on(DESKTHING_EVENTS.STOP, () => {})