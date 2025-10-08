import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { initializeListeners } from "./initializer"
import { MediaStore } from "./mediaStore";
import { deleteImages } from "./imageUtils";
import { existsSync, mkdirSync } from "node:fs";
import { imagesDir } from "./settings";

const start = async () => {
  await initializeListeners()

  if (!existsSync(imagesDir)) {
    console.log('Creating images directory');
    mkdirSync(imagesDir, { recursive: true });
  }

  console.log('Server Started!');
};

const stop = async () => {
  // Function called when the server is stopped
  const mediaStore = MediaStore.getInstance()
  mediaStore.stop()
  deleteImages()
  console.log('Server Stopped');
};

const purge = async () => {
  // Function called when the server is stopped
  const mediaStore = MediaStore.getInstance()
  mediaStore.purge()
  deleteImages()
  console.log('Server Purged');
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.PURGE, purge);