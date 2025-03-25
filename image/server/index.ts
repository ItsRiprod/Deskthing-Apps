import { AppSettings, DESKTHING_EVENTS, SETTING_TYPES } from '@deskthing/types';
import { createDeskThing } from '@deskthing/server';
import dotenv from 'dotenv';

dotenv.config();

type ToClientData = {
  type: 'imageData', payload: string
}

enum IMAGE_REQUESTS {
  GET = 'get'
}

type ToServerData = {
  type: IMAGE_REQUESTS.GET, request: 'image', payload?: string
}

const DeskThing = createDeskThing<ToServerData, ToClientData>()

const sendImageToClient = async (imagePath: string) => {
  try {
    const imageUrl = process.env.DESKTHING_ENV == 'development' ? imagePath : await DeskThing.saveImageReferenceFromURL(imagePath)

    if (!imageUrl) {
      DeskThing.sendError('Error saving image reference');
      return;
    }

    DeskThing.sendDebug('Sending Image ' + imageUrl + ' to client')


    DeskThing.send({
      type: 'imageData', payload: imageUrl
    });
  } catch (error) {
    DeskThing.sendError('Error reading image file: ' + error);
  }
};

const start = async () => {
  const settings: AppSettings = {
    "image_source": {
      value: 'prompt',
      id: 'image_source',
      type: SETTING_TYPES.STRING,
      label: "Image Source"
    },
  }
  DeskThing.initSettings(settings)
}

const stop = async () => {
  // Function called when the server is stopped
}

DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (setting) => {
  if (setting.payload.image_source.value === 'prompt') {
    DeskThing.sendError('No Image Found')
  } else if (setting.payload.image_source.value !== 'unset' && setting.payload.image_source.type == SETTING_TYPES.STRING) {
    await sendImageToClient(setting.payload.image_source.value);
  }
})

DeskThing.on(IMAGE_REQUESTS.GET, async (data) => {
  if (data.type == null) {
    DeskThing.sendError('No args provided!')
    return
  }
  switch (data.request) {
    case 'image':
      const Data = await DeskThing.getSettings()
      if (Data?.image_source.value !== 'unset' && Data?.image_source.value !== 'prompt') {
        await sendImageToClient(Data?.image_source.value as string)
      } else {
        DeskThing.sendError('No image source found!')
      }
      break
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`)
      break
    // Handle other types ?
  }
})

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start)

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop)