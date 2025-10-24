import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import storeProvider from "./spotify/storeProvider";

DeskThing.on(DESKTHING_EVENTS.CLIENT_STATUS, (data) => {
  const sessionStore = storeProvider.getSessionStore();

  switch (data.request) {
    case 'connections':
      sessionStore.ensureConnected(data.payload)
      break
    case 'connected':
      sessionStore.open(data.payload)
      break
    case 'opened':
      sessionStore.open(data.payload)
      break
    case 'disconnected':
      sessionStore.close(data.payload)
      break
    case 'closed':
      sessionStore.open(data.payload)
      break
  }
})