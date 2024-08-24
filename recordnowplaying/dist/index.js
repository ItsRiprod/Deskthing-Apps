"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeskThing = void 0;
const deskthing_server_1 = require("deskthing-server");
const DeskThing = deskthing_server_1.DeskThing.getInstance();
exports.DeskThing = DeskThing;
const start = async () => {
    let Data = await DeskThing.getData();
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData;
        DeskThing.sendLog('New data received!' + Data);
    });
    // Template Items
    // This is how to add settings (implementation may vary)
    if (!Data?.settings?.view) {
        DeskThing.addSettings({
            "view": { label: "Theme Choice", value: 'dark', options: [{ label: 'Dark Theme', value: 'dark' }, { label: 'Light Theme', value: 'light' }] },
        });
        // This will make Data.settings.theme.value equal whatever the user selects
    }
};
const stop = async () => {
    // Function called when the server is stopped
};
// Main Entrypoint of the server
DeskThing.on('start', start);
// Main exit point of the server
DeskThing.on('stop', stop);
