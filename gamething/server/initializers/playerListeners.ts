import { createDeskThing } from "@deskthing/server";
import { FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER } from "../../shared/types/transit";
import { playerStore } from "../stores/index";
import { DeskthingStore } from "../stores/deskthingStore";
import { DESKTHING_EVENTS } from "@deskthing/types";

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>()


DeskThing.on(GAME_CLIENT.PLAYER, (data) => {
  const { clientId } = data;

  if (!clientId) {
    console.error(`Client ID is required to interact with rooms (none sent in request ${data.request})`)
    return
  }

  console.log(`Handling action to ${data.request} the ${clientId}`)

  switch (data.request) {
    case 'get': {
      const player = playerStore.getPlayer(clientId);

      DeskthingStore.sendTo(clientId, {
        type: GAME_SERVER.PLAYER_DATA,
        payload: player
      });
      break;
    }
    case 'update': {
      const { payload: player } = data;
      const updatedPlayer = playerStore.updatePlayer(clientId, player);
      DeskthingStore.sendTo(clientId, {
        type: GAME_SERVER.PLAYER_DATA,
        payload: updatedPlayer
      });
      break;
    }
  }
})

DeskThing.on(DESKTHING_EVENTS.CLIENT_STATUS, (data) => {
  switch (data.request) {
    case 'closed':
      console.log(`Handling ${data.clientId} closing the app`)
      playerStore.removePlayer(data.clientId || data.payload.clientId)
      break
    case 'disconnected':
      console.log(`Handling ${data.clientId} disconnecting`)
      playerStore.removePlayer(data.clientId || data.payload)
      break
  }
})