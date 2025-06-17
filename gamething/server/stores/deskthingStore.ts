
import { createDeskThing } from "@deskthing/server";
import { FromClientToServer, FromServerToClient, GAME_SERVER } from "../../shared/types/transit";

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>();

export class DeskthingStore {
  public static sendTo(clientId: string, message: FromServerToClient) {
    DeskThing.send({ clientId, ...message });
  }

  public static sendBurst(clientIds: string[], message: FromServerToClient) {
    for (const clientId of clientIds) {
      DeskThing.send({ clientId, ...message });
    }
  }

  public static send(message: FromServerToClient) {
    DeskThing.send(message);
  }

  public static sendError(message: string, clientId?: string) {
    DeskThing.send({ clientId, type: GAME_SERVER.NOTIFICATION, payload: { type: 'error', message } });
  }

  public static sendInfo(message: string, clientId?: string) {
    DeskThing.send({ clientId, type: GAME_SERVER.NOTIFICATION, payload: { type: 'info', message } });
  }

  public static sendSuccess(message: string, clientId?: string) {
    DeskThing.send({ clientId, type: GAME_SERVER.NOTIFICATION, payload: { type: 'success', message } });
  }

}
