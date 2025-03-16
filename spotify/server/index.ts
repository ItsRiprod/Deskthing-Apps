import { ServerEvent } from '@deskthing/types'
import { DeskThing } from '@deskthing/server'
import { initialize } from './initializer'

const start = async () => {
  // Dynamically import the initializer
  await initialize() 
  DeskThing.sendLog('Spotify app started!')
}


DeskThing.on(ServerEvent.START, start)