import EventEmitter from "node:events";
import { LinkClient } from "../shared";
import { DeskThing } from "@deskthing/server";

type ClientStoreEvents = {
  "client-added": [LinkClient];
  "client-removed": [string];
  "clients-updated": [LinkClient[]];
  "client-list": [LinkClient[]];
  "score-updated": [string, LinkClient];
};

export class ClientStore extends EventEmitter<ClientStoreEvents> {
  private static instance: ClientStore;
  private clients: LinkClient[] = [];

  private constructor() {
    super();
    DeskThing.sendDebug("ClientStore initialized");
  }

  public static getInstance(): ClientStore {
    if (!ClientStore.instance) {
      ClientStore.instance = new ClientStore();
      DeskThing.sendDebug("ClientStore instance created");
    }
    return ClientStore.instance;
  }

  addClient(client: LinkClient) {
    try {
      if (!this.clients.find((c) => c.id === client.id)) {
        this.clients.push(client);
        DeskThing.sendDebug(`Client added: ${client.id}`);
      } else {
        DeskThing.sendDebug(`Client already exists: ${client.id}`);
      }
      this.emit("client-added", client);
      this.emit("clients-updated", this.clients);
    } catch (error) {
      DeskThing.sendLog(`Error adding client: ${error}`);
    }
  }

  addClientId(id: string, inc: number = 1) {
    try {
      const client: LinkClient = {
        id: id,
        color: this.generateRandomColor(),
        score: inc,
      };

      this.addClient(client);
      this.emit("client-added", client);
      this.emit("clients-updated", this.clients);
      return client;
    } catch (error) {
      DeskThing.sendLog(`Error adding client by ID: ${error}`);
    }
  }

  removeClient(id: string) {
    try {
      const initialLength = this.clients.length;
      this.clients = this.clients.filter((c) => c.id !== id);
      if (this.clients.length === initialLength) {
        DeskThing.sendDebug(`Client not found for removal: ${id}`);
      } else {
        DeskThing.sendDebug(`Client removed: ${id}`);
      }
      this.emit("client-removed", id);
      this.emit("clients-updated", this.clients);
    } catch (error) {
      DeskThing.sendLog(`Error removing client: ${error}`);
    }
  }

  getClients() {
    try {
      return this.clients;
    } catch (error) {
      DeskThing.sendLog(`Error getting clients: ${error}`);
      return [];
    }
  }

  getClient(id: string): LinkClient | undefined {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (!client) {
        DeskThing.sendDebug(`Client not found: ${id}`);
        return this.addClientId(id)
      }
      return client;
    } catch (error) {
      DeskThing.sendLog(`Error getting client: ${error}`);
      return this.addClientId(id)
    }
  }


  incrementScore(id: string, inc: number) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client) {
        client.score += inc;
        DeskThing.sendDebug(
          `Score incremented for client ${id}: ${client.score}`
        );
        this.emit("score-updated", id, client);
        this.emit("clients-updated", this.clients);
      } else {
        DeskThing.sendDebug(`Client not found for score increment: ${id}`);
        this.addClientId(id, inc)
      }
    } catch (error) {
      DeskThing.sendLog(`Error incrementing score: ${error}`);
    }
  }

  decrementScore(id: string) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client && client.score > 0) {
        client.score -= 1;
        DeskThing.sendDebug(
          `Score decremented for client ${id}: ${client.score}`
        );
        this.emit("score-updated", id, client);
        this.emit("clients-updated", this.clients);
      } else {
        DeskThing.sendDebug(`Client not found or score already 0: ${id}`);
      }
    } catch (error) {
      DeskThing.sendLog(`Error decrementing score: ${error}`);
    }
  }

  resetScore(id: string) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client) {
        client.score = 0;
        DeskThing.sendDebug(`Score reset for client ${id}`);
        this.emit("score-updated", id, client);
        this.emit("clients-updated", this.clients);
      } else {
        DeskThing.sendDebug(`Client not found for score reset: ${id}`);
      }
    } catch (error) {
      DeskThing.sendLog(`Error resetting score: ${error}`);
    }
  }

  updateColor(id: string, color: string) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client) {
        client.color = color;
        DeskThing.sendDebug(`Color updated for client ${id}: ${color}`);
        this.emit("clients-updated", this.clients);
      } else {
        DeskThing.sendDebug(`Client not found for color update: ${id}`);
      }
    } catch (error) {
      DeskThing.sendLog(`Error updating color: ${error}`);
    }
  }

  private generateRandomColor(): string {
    try {
      const letters = "0123456789ABCDEF";
      let color = "#";
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      DeskThing.sendDebug(`Generated random color: ${color}`);
      return color;
    } catch (error) {
      DeskThing.sendLog(`Error generating random color: ${error}`);
      return "#000000";
    }
  }
}

export default ClientStore.getInstance();
