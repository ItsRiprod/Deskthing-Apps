import { DeskThing } from "@deskthing/server";
import { AppSettings, DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import { handleBinary } from "./micHandler";

const start = async () => {
  console.log('Server Started!')

  const settings: AppSettings = {
    color: {
      label: 'App Color',
      id: 'color',
      type: SETTING_TYPES.COLOR,
      value: '#000000'
    }
  }

  DeskThing.initSettings(settings)
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