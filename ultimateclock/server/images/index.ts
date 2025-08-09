import { DESKTHING_EVENTS, SETTING_TYPES } from '@deskthing/types';
import { createDeskThing } from '@deskthing/server';
import { saveImageReferenceFromURL } from './utils';
import { ToClientData, ToServerData } from '../../shared/transit';
import { ClockSettingIDs, ClockSettings } from '../../shared/settings';

const DeskThing = createDeskThing<ToServerData, ToClientData>()

const sendImageToClient = async (imagePath: string) => {
  try {
    const imageUrl = await saveImageReferenceFromURL(imagePath)

    if (!imageUrl) {
      console.debug('Error saving image reference');
      return;
    }

    console.debug('Sending Image ' + imageUrl + ' to client')


    DeskThing.send({
      type: 'image', request: 'data', payload: imageUrl
    });
  } catch (error) {
    console.error('Error reading image file: ' + error);
  }
};

DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (setting) => {
  // First check if there is an image file provided
  if (setting.payload[ClockSettingIDs.BACKGROUND_IMAGE].value && setting.payload[ClockSettingIDs.BACKGROUND_IMAGE].type == SETTING_TYPES.FILE) {
    await sendImageToClient(setting.payload[ClockSettingIDs.BACKGROUND_IMAGE].value);
  }
})

DeskThing.on('image', async (data) => {
  if (data.type == null) {
    console.warn('No args provided!')
    return
  }
  switch (data.request) {
    case 'request': {

      const Data = await DeskThing.getSettings() as ClockSettings
      if (Data?.[ClockSettingIDs.BACKGROUND_IMAGE].value && Data[ClockSettingIDs.BACKGROUND_IMAGE].type == SETTING_TYPES.FILE) {
        await sendImageToClient(Data?.[ClockSettingIDs.BACKGROUND_IMAGE].value)
      } else {
        console.debug('No image source found!')
      }
      break
    }
    default:
      console.debug(`Unknown request: ${data.request}`)
      break
    // Handle other types ?
  }
})