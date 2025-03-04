import SpotifyHandler from './spotify'
import { IncomingData, ServerEvent } from '@deskthing/types'
import { DeskThing } from '@deskthing/server'
export { DeskThing }


let spotify: SpotifyHandler

const start = async () => {
  spotify = new SpotifyHandler()

  DeskThing.on(ServerEvent.GET, handleGet)
  DeskThing.on(ServerEvent.SET, handleSet)
  DeskThing.sendLog('Spotify app started!')
  DeskThing.on(ServerEvent.CALLBACK_DATA, handleCallbackData)
}

const handleCallbackData = async (data: IncomingData) => {
  if (data.payload == null) {
    DeskThing.sendError('Unable to get access token')
  } else {
    await spotify.getAccessToken(data.payload)
  }
}

const handleGet = async (data: IncomingData) => {

  if (data.type == null) {
    DeskThing.sendError('No args provided!')
    return
  }
  switch (data.request) {
    case 'song':
      await spotify.returnSongData()
      break
    case 'refresh':
      await spotify.checkForRefresh()
      break
    case 'playlists': // Returns all playlists as array
      await spotify.playlists()
      break
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`)
      break
    // Handle other types ?
  }
}
const handleSet = async (data: IncomingData) => {

  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  let response
  switch (data.request) {
    case 'next':
      response = await spotify.next(data.payload)
      break
    case 'previous':
      response = await spotify.previous()
      break
    case 'fast_forward':
      response = await spotify.fastForward(data.payload)
      break
    case 'rewind':
      response = await spotify.rewind(data.payload)
      break
    case 'play':
      response = await spotify.play(data.payload)
      break
    case 'pause':
    case 'stop':
      response = await spotify.pause()
      break
    case 'seek':
      response = await spotify.seek(data.payload)
      break
    case 'like':
      response = await spotify.like(data.payload)
      break
    case 'volume':
      response = await spotify.volume(data.payload)
      break
    case 'repeat':
      response = await spotify.repeat(data.payload)
      break
    case 'shuffle':
      response = await spotify.shuffle(data.payload)
      break
    case 'transfer':
      response = await spotify.transfer()
      break
    case 'play_playlist': // Expects playlist index
      response = await spotify.playPlaylist(data.payload)
      break
    case 'set_playlist': // Expects playlist index
      response = await spotify.setPlaylist(data.payload)
      break
    case 'add_playlist': // Expects playlist index
      response = await spotify.addToPlaylist(data.payload)
      break
  }
  DeskThing.sendLog(response)
}

DeskThing.on(ServerEvent.START, start)