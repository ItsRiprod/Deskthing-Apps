import { DeskThing as DK, AppSettings } from 'deskthing-server';
import * as fs from 'fs/promises'; 
import * as path from 'path';

const DeskThing = DK.getInstance();
export { DeskThing } // Required export of this exact name for the server to connect

const start = async () => {
  let Data = await DeskThing.getData()
  DeskThing.on('data', (newData) => {
    // Syncs the data with the server
    Data = newData
  })

  if (!Data?.settings?.image_source) {
    const settings: AppSettings = {
      "image_source": {
        "value": 'prompt',
        "type": "string",
        "label": "Image Source"
      },
    }
    DeskThing.addSettings(settings)
  } else {
    DeskThing.sendLog('Found image ' + Data.settings.image_source.value)
  }

  const sendImageToClient = async (imagePath: string) => {
    try {
      await fs.access(imagePath);
      const imageData = await fs.readFile(imagePath);
      const base64Image = imageData.toString('base64');
      const mimeType = path.extname(imagePath).slice(1); // Get file extension to use as MIME type

      DeskThing.sendDataToClient({
        type: 'imageData', payload: `data:image/${mimeType};base64,${base64Image}`
      });
    } catch (error) {
      DeskThing.sendError('Error reading image file: ' + error);
    }
  };

  if (Data?.settings?.image_source.value === 'prompt') {
    DeskThing.sendError('No Image Found')
  } else if (Data?.settings?.image_source.value !== 'unset') {
    DeskThing.sendLog('Sending Image ' + Data?.settings?.image_source.value + ' to client')
    await sendImageToClient(Data?.settings?.image_source.value as string);
  }

  DeskThing.on('settings', async (setting) => {
    if (setting.image_source.value === 'prompt') {
      DeskThing.sendError('No Image Found')
    } else if (setting.image_source.value !== 'unset') {
      DeskThing.sendLog('Sending Image ' + setting.image_source.value + ' to client')
      await sendImageToClient(setting.image_source.value as string);
    }
  })

  DeskThing.on('get', async (data) => {
    if (data.type == null) {
      DeskThing.sendError('No args provided!')
      return
    }
    switch (data.request) {
      case 'image':
        if (Data?.settings?.image_source.value !== 'unset' && Data?.settings?.image_source.value !== 'prompt') {
          await sendImageToClient(Data?.settings?.image_source.value as string)
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
}

const stop = async () => {
  // Function called when the server is stopped
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)