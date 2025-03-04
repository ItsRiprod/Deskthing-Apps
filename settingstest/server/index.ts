import { DeskThing } from '@deskthing/server';
import { setupActions } from './actions';
import { setupSettings } from './settings';
import { setupTasks } from './tasks/tasks';
import { userInput } from './userInput';
import { setupWorkers } from './workerExample';
// Doing this is required in order for the server to link with DeskThing
export { DeskThing }

// This is triggered at the end of this file with the on('start') listener. It runs when the DeskThing starts your app. It serves as the entrypoint for your app
const start = async () => {
    setupSettings();
    userInput();
    setupWorkers()
    setupActions()
    setupTasks()
} 

const stop = async () => {
    // Function called when the server is stopped
}

// Main Entrypoint of the server. This is run whenever the app starts.
DeskThing.on('start', start)

// This function is called once the app is stopped.
DeskThing.on('stop', stop)

DeskThing.on('purge', async () => {
    // This is called when the server is purged. Use this to clean up any data or resources that were created during the app's lifetime.
})