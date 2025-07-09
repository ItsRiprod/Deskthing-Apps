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
      console.debug(`Sent client data to client`);
    }
  } catch (error) {
    console.log(`Error handling DATA event: ${error}`);
  }
});

DeskThing.on(LINK_TO_SERVER.SCORE, (data) => {
  try {
    if (data.request === "add") {
      clientStore.incrementScore(data.clientId, data.payload.inc);
      console.debug(`Score increment requested for client: ${data.clientId}`);
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
        console.debug(`Sent score data for client: ${client.id}`);
      } else {
        console.debug(`Client not found for score request: ${data.clientId}`);
      }
    }
  } catch (error) {
    console.log(`Error handling SCORE event: ${error}`);
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
      console.debug(`Color update requested for client: ${data.clientId}`);
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
        console.debug(`Sent color data for client: ${client.id}`);
      } else {
        console.debug(`Client not found for color request: ${data.clientId}`);
      }
    }
  } catch (error) {
    console.log(`Error handling COLOR event: ${error}`);
  }
});

DeskThing.on(LINK_TO_SERVER.REQUEST_NEW_CLIENT, (data) => {
  try {
    if (data.request === "get") {
      const clientId = data.clientId;

      if (!clientId) {
        console.warn(`Client ID not provided for request`);
        return;
      }

      clientStore.addClientId(clientId);
      const client = clientStore.getClient(clientId);

      if (!client) {
        console.warn(`Client not found for request: ${clientId}`);
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


      console.debug(`Request for new client resolved`);
    }
  } catch (error) {
    console.log(`Error handling REQUEST_NEW_CLIENT event: ${error}`);
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
          console.debug(`Client initialized: ${clientId}`);
        } else {
          console.debug(`Client not found for initialization: ${clientId}`);
        }
        break;
      case 'closed':
        clientStore.removeClient(data.payload.clientId);
        console.debug(`Client closed: ${data.payload.clientId}`);
        break;
      case 'disconnected':
        clientStore.removeClient(data.payload);
        console.debug(`Client disconnected: ${data.payload}`);
        break;
    }
  } catch (error) {
    console.log(`Error handling CLIENT_STATUS event: ${error}`);
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
      console.debug(`Clients updated event emitted`);
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
      console.debug(`Score updated event emitted for client: ${clientId}`);
    });

    listenersInitialized = true;
    console.debug(`Listeners initialized`);
  } catch (error) {
    console.log(`Error initializing listeners: ${error}`);
  }
}