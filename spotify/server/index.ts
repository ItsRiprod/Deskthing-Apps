import SpotifyHandler from './spotify'
import { DeskThing as DK, IncomingData } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }


let spotify: SpotifyHandler

const start = async () => {
  spotify = new SpotifyHandler()

  DeskThing.on('get', handleGet)
  DeskThing.on('set', handleSet)

  DeskThing.on('callback-data', handleCallbackData)
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
  }
  DeskThing.sendLog(response)
}

DeskThing.on('start', start)