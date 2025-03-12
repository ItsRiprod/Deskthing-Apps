import { SocketData, ServerEvent } from '@deskthing/types'
import { DeskThing } from '@deskthing/server'
export { DeskThing }

const start = async () => {
  // Dynamically import the initializer
  const { initialize } = await import('./initializer')
  await initialize() 
  DeskThing.sendLog('Spotify app started!')

}


DeskThing.on(ServerEvent.START, start)