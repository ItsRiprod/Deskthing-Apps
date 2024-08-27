"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeskThing = void 0;
const deskthing_server_1 = require("deskthing-server");
const promises_1 = __importDefault(require("fs/promises")); // Import the fs module to read files
const path_1 = __importDefault(require("path"));
const DeskThing = deskthing_server_1.DeskThing.getInstance();
exports.DeskThing = DeskThing;
const start = async () => {
    let Data = await DeskThing.getData();
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData;
    });
    if (!Data?.settings?.source) {
        const settings = {
            "image_source": {
                "value": 'prompt',
                "label": "Image Source",
                "options": [
                    {
                        "value": "unset",
                        "label": "Unset"
                    },
                    {
                        "value": "prompt",
                        "label": "Prompt for Another"
                    },
                ]
            },
        };
        DeskThing.addSettings(settings);
    }
    const sendImageToClient = async (imagePath) => {
        try {
            const imageData = await promises_1.default.readFile(imagePath);
            const base64Image = imageData.toString('base64');
            const mimeType = path_1.default.extname(imagePath).slice(1); // Get file extension to use as MIME type
            DeskThing.sendDataToClient({
                type: 'imageData', payload: `data:image/${mimeType};base64,${base64Image}`
            });
        }
        catch (error) {
            DeskThing.sendError('Error reading image file: ' + error);
        }
    };
    // Getting data from the user (Ensure these match)
    const promptForImage = async () => {
        const requestScopes = {
            'image_source': {
                'value': 'C:/',
                'label': 'Image Source',
                'instructions': 'Input the absolute path to the image you want to display.',
            }
        };
        DeskThing.getUserInput(requestScopes, async (data) => {
            if (data.payload.image_source) {
                const newImageSource = data.payload.image_source;
                // Add the new image source to the settings options
                if (!Data?.settings?.image_source.options.some(opt => opt.value === newImageSource)) {
                    Data?.settings?.image_source.options.push({
                        value: newImageSource,
                        label: `Image: ${path_1.default.basename(newImageSource)}`,
                    });
                }
                // Save the updated settings
                DeskThing.saveData({ settings: Data?.settings });
                // Send the new image to the client
                await sendImageToClient(newImageSource);
                // If still set to prompt, prompt again
                if (Data?.settings?.image_source.value === 'prompt') {
                    promptForImage();
                }
            }
            else {
                DeskThing.sendError('Please fill out all the fields! Restart to try again');
            }
        });
    };
    if (Data?.settings?.image_source.value === 'prompt') {
        await promptForImage();
    }
    else if (Data?.settings?.image_source.value !== 'unset') {
        await sendImageToClient(Data?.settings?.image_source.value);
    }
    DeskThing.on('settings', async (setting) => {
        if (setting.image_source.value === 'prompt') {
            await promptForImage();
        }
        else if (setting.image_source.value !== 'unset') {
            await sendImageToClient(setting.image_source.value);
        }
    });
    DeskThing.on('get', async (data) => {
        if (data.type == null) {
            DeskThing.sendError('No args provided!');
            return;
        }
        switch (data.request) {
            case 'image':
                if (Data?.settings?.image_source.value !== 'unset' && Data?.settings?.image_source.value !== 'prompt') {
                    await sendImageToClient(Data?.settings?.image_source.value);
                }
                else {
                    DeskThing.sendError('No image source found!');
                }
                break;
            default:
                DeskThing.sendError(`Unknown request: ${data.request}`);
                break;
            // Handle other types ?
        }
    });
};
const stop = async () => {
    // Function called when the server is stopped
};
// Main Entrypoint of the server
DeskThing.on('start', start);
// Main exit point of the server
DeskThing.on('stop', stop);
