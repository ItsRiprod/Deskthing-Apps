import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { handleBinary } from "./micHandler";
import { settingsStore } from "./settingsHandler"

const start = async () => {
  console.log('Server Started!')

  await settingsStore.init()
};

const stop = async () => {
  // Function called when the server is stopped
  console.log('Server Stopped');
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

DeskThing.on(DESKTHING_EVENTS.BINARY, (message) => {
  switch (message.request) {
    case "binary":
      handleBinary(message.clientId, message.payload)
      break
    case 'text':
      console.log(message.payload)
      break
  }
})