/**
 * Welcome to the template app!
 *
 * This app is meant for developers to be able to reference while making their own apps. Nearly ever DeskThing feature is outlined here in some capacity to demonstrate the practical application of building an app for DeskThing!
 * Any questions, please join the discord server channel and ask there.
 *
 */

/**
 * There are two connectors. DeskThing-server and DeskThing-client
 * To optimize your app, only use DeskThing-server inside the server and DeskThing-client inside the client
 *
 * Every app must both import DeskThing-server and export DeskThing-server to allow the DeskThing Server to link with your app
 */
import { DeskThing, SocketData } from "deskthing-server";
// Doing this is required in order for the server to link with DeskThing
export { DeskThing };

// The following imports are from other files that setup their own functions
import { setupSettings } from "./settings";
import { userInput } from "./userInput";
import { sendImage, sendSampleData } from "./sendingData";

/**
 * 
 *  ----------- Setup ------------------
 * 
 *  Every app needs the following two:
 * DeskThing.on('start', start)
 *
 * DeskThing.on('stop', stop)
 *
 * Both of these should be at the end of your index.ts page. 'start' is triggered when the server is started and 'stop' is triggered when the server is stopped.
 *
 *
 * The following start() function is triggered once the server starts. This is where all initialization should be done.
 */
const start = async () => {
  // This is being used to grab any associated data from the server once the app starts. This makes sure we dont try to initialize stuff twice if it already exists
  const Data = await DeskThing.getData();

  setupSettings(Data);
  userInput(Data);
    // This will make Data.settings.theme.value equal whatever the user selects
};

const stop = async () => {
  // Function called when the server is stopped
  DeskThing.sendLog('Server Stopped');
};

// Main Entrypoint of the server
DeskThing.on("start", start);

// Main exit point of the server
DeskThing.on("stop", stop);

const handleRequest = async (socketData: SocketData) => {
  switch (socketData.request) {
    case 'sampleData':
      sendSampleData()
      break
    case 'image':
      sendImage()
      break
    default:
      DeskThing.sendError('Invalid Request')
      break
  }
}

DeskThing.on('get', handleRequest)