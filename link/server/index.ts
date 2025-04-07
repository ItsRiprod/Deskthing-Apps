import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { initListeners } from "./deskthing"

const start = async () => {
  DeskThing.sendLog('Server Started!')
  initListeners()
};

const stop = async () => {
  // Function called when the server is stopped
  DeskThing.sendLog('Server Stopped');
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);