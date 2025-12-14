import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { handleBinary } from "./micHandler";
import { settingsStore } from "./stores/settingsStore"
import { recordingsStore } from "./stores/recordingsStore"

const start = async () => {
  console.log('Server Started!')

  await settingsStore.init()
  await recordingsStore.init()
};

const stop = async () => {
  // Function called when the server is stopped
  console.log('Server Stopped');
  await recordingsStore.exit()
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

DeskThing.on(DESKTHING_EVENTS.BINARY, (message) => {
  console.log('Received binary message of size', message.payload.byteLength)
  handleBinary(message.clientId, message.payload)
})