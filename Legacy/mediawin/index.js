import MediaWinHandler from './mediawin.js'
import { DeskThing as DK } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }

let mediawin

const start = async () => {
  mediawin = new MediaWinHandler(DeskThing)

  let Data = await DeskThing.getData()
  DeskThing.on('data', (newData) => {
    Data = newData
  })

  if (!Data.settings?.change_source) {
    const settings = {
      "change_source": {
        "value": 'true',
        "label": "Switch Output on Select",
        "type": "boolean"
      },
    }
    DeskThing.addSettings(settings)
  }

  DeskThing.on('get', handleGet)
  DeskThing.on('set', handleSet)
}

DeskThing.on('start', start)


const handleGet = async (data) => {
  console.log('Receiving Get Data', data)
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  let response
  switch (data.request) {
    case 'song':
      response = await mediawin.returnSongData()
      response = { app: 'client', type: 'song', payload: response }
      DeskThing.sendDataToClient(response)
      break
    case 'refresh':
      response = await mediawin.checkForRefresh()
      if (response) {
        response = { app: 'client', type: 'song', payload: response }
        DeskThing.sendDataToClient(response)
      }
      break
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`)
      break
  }
}

const handleSet = async (data) => {
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  DeskThing.sendLog('Receiving Set Data' + data)
  console.log('Receiving Set Data', data)
  let response
  switch (data.request) {
    case 'next':
      response = await mediawin.next(data.payload)
      if (!response == false) {
        response = { app: 'client', type: 'song', payload: response }
        DeskThing.sendDataToClient(response)
      }
      break
    case 'previous':
      response = await mediawin.previous()
      break
    case 'fast_forward':
      response = await mediawin.fastForward(data.payload)
      break
    case 'rewind':
      response = await mediawin.rewind(data.payload)
      break
    case 'play':
      response = await mediawin.play(data.payload)
      break
    case 'pause':
    case 'stop':
      response = await mediawin.pause()
      break
    case 'seek':
      response = await mediawin.seek(data.payload)
      break
    case 'like':
      response = 'Unable to like songs!'
      break
    case 'volume':
      response = await mediawin.volume(data.payload)
      break
    case 'repeat':
      response = await mediawin.repeat(data.payload)
      break
    case 'shuffle':
      response = await mediawin.shuffle(data.payload)
      break
  }
}
