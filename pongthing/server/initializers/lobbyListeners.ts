import { createDeskThing } from "@deskthing/server";
import { FromClientToServer, FromServerToClient, GAME_CLIENT, GAME_SERVER } from "../../shared/types/transit";
import { DeskthingStore, roomStore } from "../stores/index";

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>()


DeskThing.on(GAME_CLIENT.ROOM, (data) => {
  const { clientId } = data;

  if (!clientId) {
    console.error(`Client ID is required to interact with rooms (none sent in request ${data.request})`)
    return
  }

  switch (data.request) {
    case 'create': {
      roomStore.createRoom(clientId, data.payload.game, data.payload.color);
    }
      break
    case 'join': {
      roomStore.addPlayerToRoom(data.payload.roomId, clientId)
      break;
    }

    case 'get': {
      const room = roomStore.getRoomByClientId(clientId)

      if (!room) {
        DeskthingStore.sendError('You are not in a room', clientId)
        return
      }

      DeskThing.send({
        type: GAME_SERVER.ROOMS_UPDATE,
        payload: room,
        clientId
      })
      break;
    }

    case 'ready': {
      const room = roomStore.getRoomByClientId(clientId);
      if (!room) {
        DeskthingStore.sendError('Unable to ready up, room not found', clientId)
        return
      }
      roomStore.setPlayerReady(room.id, clientId, data.payload);
      break;
    }

    case 'leave': {
      const room = roomStore.getRoomByClientId(clientId);
      if (!room) {
        DeskthingStore.sendError('Unable to leave room, room not found', clientId)
        return
      }
      roomStore.removePlayerFromRoom(room.id, clientId);
      break;
    }
    case 'start': {
      break;
    }

    case 'update': {
      const room = roomStore.getRoomByClientId(clientId);
      if (!room) {
        DeskthingStore.sendError('Unable to update room state, room not found', clientId)
        return
      }
      if (room.ownerId != clientId) {
        DeskthingStore.sendError('You do not own this room!', clientId)
        return
      }
      roomStore.updateRoomState(room.id, data.payload);
      break;
    }
  }
})

DeskThing.on(GAME_CLIENT.LOBBY, (data) => {
  const { clientId } = data;

  switch (data.request) {
    case 'get': {
      const lobby = roomStore.getLobby()
      DeskThing.send({
        type: GAME_SERVER.LOBBY_STATE,
        payload: lobby,
        clientId
      })
      break;
    }
  }

})