import { DeskThing } from '@deskthing/server';
import { ServerEvent } from '@deskthing/types';
export { DeskThing } // Required export of this exact name for the server to connect
import dotenv from 'dotenv'
dotenv.config()

DeskThing.on(ServerEvent.START, async () => {

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


DeskThing.on(ServerEvent.STOP, () => {})