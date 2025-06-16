import { createDeskThing } from "@deskthing/server";
import { FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER } from "../../shared/types/transit";
import { DeskthingStore, roomStore, gameRegistry } from "../stores/index";

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>();

DeskThing.on(GAME_CLIENT.GAME_UPDATE, async (data) => {
  if (!data.clientId) return;

  const room = roomStore.getRoomByClientId(data.clientId);
  if (!room || !room.status) return;


  switch (data.request) {
    case 'update':
      try {
        const updatedState = await gameRegistry.handleGameUpdate(
          data.clientId,
          data.payload
        );

        if (updatedState) {
          DeskthingStore.sendBurst(room.playerIds, {
            type: GAME_SERVER.GAME_DATA,
            payload: updatedState
          });
        }
      } catch (error) {
        console.error('Error handling game update:', error);
      }
      break
    case 'start':
      await gameRegistry.handleGameStart({ room })
      break
  }

});