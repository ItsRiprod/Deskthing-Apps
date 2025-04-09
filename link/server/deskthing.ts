import { createDeskThing } from "@deskthing/server";
import clientStore from "./clientStore";
import {
  LINK_TO_CLIENT,
  LINK_TO_SERVER,
  ToClientData,
  ToLinkData,
} from "../shared/transit";
import { DESKTHING_EVENTS } from "@deskthing/types"

const DeskThing = createDeskThing<ToLinkData, ToClientData>();

// Data received from the client

DeskThing.on(LINK_TO_SERVER.DATA, async (data) => {
  try {
    if (data.request === "get") {
      const clients = clientStore.getClients();

      DeskThing.send({
        type: LINK_TO_CLIENT.DATA,
        request: "set",
        payload: {
          clients: clients
        }
      });
      DeskThing.sendDebug(`Sent client data to client`);
    }
  } catch (error) {
    DeskThing.sendLog(`Error handling DATA event: ${error}`);
  }
});

DeskThing.on(LINK_TO_SERVER.SCORE, (data) => {
  try {
    if (data.request === "add") {
      clientStore.incrementScore(data.clientId, data.payload.inc);
      DeskThing.sendDebug(`Score increment requested for client: ${data.clientId}`);
    } else if (data.request === "get") {
      const client = clientStore.getClient(data.clientId);
      if (client) {
        DeskThing.send({
          type: LINK_TO_CLIENT.DATA,
          request: "set",
          payload: {
            clients: clientStore.getClients()
          }
        });
        DeskThing.sendDebug(`Sent score data for client: ${client.id}`);
      } else {
        DeskThing.sendDebug(`Client not found for score request: ${data.clientId}`);
      }
    }
  } catch (error) {
    DeskThing.sendLog(`Error handling SCORE event: ${error}`);
  }
});

DeskThing.on(LINK_TO_SERVER.COLOR, (data) => {
  try {
    if (data.request === "set") {
      clientStore.updateColor(data.clientId, data.payload.color);
      DeskThing.send({
        type: LINK_TO_CLIENT.DATA,
        request: "set",
        payload: {
          clients: clientStore.getClients()
        }
      });
      DeskThing.sendDebug(`Color update requested for client: ${data.clientId}`);
    } else if (data.request === "get") {
      const client = clientStore.getClient(data.clientId);
      if (client) {
        DeskThing.send({
          type: LINK_TO_CLIENT.COLOR,
          request: "set",
          clientId: client.id,
          payload: {
            color: client.color
          }
        });
        DeskThing.sendDebug(`Sent color data for client: ${client.id}`);
      } else {
        DeskThing.sendDebug(`Client not found for color request: ${data.clientId}`);
      }
    }
  } catch (error) {
    DeskThing.sendLog(`Error handling COLOR event: ${error}`);
  }
});

DeskThing.on(LINK_TO_SERVER.REQUEST_NEW_CLIENT, (data) => {
  try {
    if (data.request === "get") {
      const clientId = data.clientId;

      if (!clientId) {
        DeskThing.sendWarning(`Client ID not provided for request`);
        return;
      }

      clientStore.addClientId(clientId);
      const client = clientStore.getClient(clientId);

      if (!client) {
        DeskThing.sendWarning(`Client not found for request: ${clientId}`);
        return;
      }

      DeskThing.send({
        type: LINK_TO_CLIENT.INIT,
        request: "set",
        clientId: clientId,
        payload: {
          client: client,
          clients: clientStore.getClients()
        }
      });


      DeskThing.sendDebug(`Request for new client resolved`);
    }
  } catch (error) {
    DeskThing.sendLog(`Error handling REQUEST_NEW_CLIENT event: ${error}`);
  }
});

DeskThing.on(DESKTHING_EVENTS.CLIENT_STATUS, async (data) => {
  try {
    switch (data.request) {
      case 'opened':
        const clientId = data.payload.clientId;
        clientStore.addClientId(clientId);
        const client = clientStore.getClient(clientId);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (client) {
          DeskThing.send({
            type: LINK_TO_CLIENT.INIT,
            request: "set",
            clientId: clientId,
            payload: {
              client: client,
              clients: clientStore.getClients()
            }
          });
          DeskThing.sendDebug(`Client initialized: ${clientId}`);
        } else {
          DeskThing.sendDebug(`Client not found for initialization: ${clientId}`);
        }
        break;
      case 'closed':
        clientStore.removeClient(data.payload.clientId);
        DeskThing.sendDebug(`Client closed: ${data.payload.clientId}`);
        break;
      case 'disconnected':
        clientStore.removeClient(data.payload);
        DeskThing.sendDebug(`Client disconnected: ${data.payload}`);
        break;
    }
  } catch (error) {
    DeskThing.sendLog(`Error handling CLIENT_STATUS event: ${error}`);
  }
});

let listenersInitialized = false;

export const initListeners = () => {
  try {
    if (listenersInitialized) return;
    
    clientStore.on("clients-updated", (clients) => {
      DeskThing.send({
        type: LINK_TO_CLIENT.DATA,
        request: "set",
        payload: {
          clients: clients
        }
      });
      DeskThing.sendDebug(`Clients updated event emitted`);
    });
    
    clientStore.on("score-updated", (clientId, client) => {
      DeskThing.send({
        type: LINK_TO_CLIENT.DATA,
        request: "update",
        clientId: clientId,
        payload: {
          client: client
        }
      });
      DeskThing.sendDebug(`Score updated event emitted for client: ${clientId}`);
    });

    listenersInitialized = true;
    DeskThing.sendDebug(`Listeners initialized`);
  } catch (error) {
    DeskThing.sendLog(`Error initializing listeners: ${error}`);
  }
}