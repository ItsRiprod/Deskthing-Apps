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
    console.debug("ClientStore initialized");
  }

  public static getInstance(): ClientStore {
    if (!ClientStore.instance) {
      ClientStore.instance = new ClientStore();
      console.debug("ClientStore instance created");
    }
    return ClientStore.instance;
  }

  addClient(client: LinkClient) {
    try {
      if (!this.clients.find((c) => c.id === client.id)) {
        this.clients.push(client);
        console.debug(`Client added: ${client.id}`);
      } else {
        console.debug(`Client already exists: ${client.id}`);
      }
      this.emit("client-added", client);
      this.emit("clients-updated", this.clients);
    } catch (error) {
      console.log(`Error adding client: ${error}`);
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
      console.log(`Error adding client by ID: ${error}`);
    }
  }

  removeClient(id: string) {
    try {
      const initialLength = this.clients.length;
      this.clients = this.clients.filter((c) => c.id !== id);
      if (this.clients.length === initialLength) {
        console.debug(`Client not found for removal: ${id}`);
      } else {
        console.debug(`Client removed: ${id}`);
      }
      this.emit("client-removed", id);
      this.emit("clients-updated", this.clients);
    } catch (error) {
      console.log(`Error removing client: ${error}`);
    }
  }

  getClients() {
    try {
      return this.clients;
    } catch (error) {
      console.log(`Error getting clients: ${error}`);
      return [];
    }
  }

  getClient(id: string): LinkClient | undefined {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (!client) {
        console.debug(`Client not found: ${id}`);
        return this.addClientId(id)
      }
      return client;
    } catch (error) {
      console.log(`Error getting client: ${error}`);
      return this.addClientId(id)
    }
  }


  incrementScore(id: string, inc: number) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client) {
        client.score += inc;
        console.debug(
          `Score incremented for client ${id}: ${client.score}`
        );
        this.emit("score-updated", id, client);
        this.emit("clients-updated", this.clients);
      } else {
        console.debug(`Client not found for score increment: ${id}`);
        this.addClientId(id, inc)
      }
    } catch (error) {
      console.log(`Error incrementing score: ${error}`);
    }
  }

  decrementScore(id: string) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client && client.score > 0) {
        client.score -= 1;
        console.debug(
          `Score decremented for client ${id}: ${client.score}`
        );
        this.emit("score-updated", id, client);
        this.emit("clients-updated", this.clients);
      } else {
        console.debug(`Client not found or score already 0: ${id}`);
      }
    } catch (error) {
      console.log(`Error decrementing score: ${error}`);
    }
  }

  resetScore(id: string) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client) {
        client.score = 0;
        console.debug(`Score reset for client ${id}`);
        this.emit("score-updated", id, client);
        this.emit("clients-updated", this.clients);
      } else {
        console.debug(`Client not found for score reset: ${id}`);
      }
    } catch (error) {
      console.log(`Error resetting score: ${error}`);
    }
  }

  updateColor(id: string, color: string) {
    try {
      const client = this.clients.find((c) => c.id === id);
      if (client) {
        client.color = color;
        console.debug(`Color updated for client ${id}: ${color}`);
        this.emit("clients-updated", this.clients);
      } else {
        console.debug(`Client not found for color update: ${id}`);
      }
    } catch (error) {
      console.log(`Error updating color: ${error}`);
    }
  }

  private generateRandomColor(): string {
    try {
      const letters = "0123456789ABCDEF";
      let color = "#";
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      console.debug(`Generated random color: ${color}`);
      return color;
    } catch (error) {
      console.log(`Error generating random color: ${error}`);
      return "#000000";
    }
  }
}

export default ClientStore.getInstance();
