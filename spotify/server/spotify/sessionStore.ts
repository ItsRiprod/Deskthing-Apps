import { Client } from "@deskthing/types";

export class SessionStore {
  private clients: Map<string, Client> = new Map();

  // Mark client as having the app open
  open(client: Client) {
    this.clients.set(client.clientId, client);
  }

  // Ensure client is marked as open (idempotent)
  ensure(client: Client) {
    this.clients.set(client.clientId, client);
  }

  // Mark client as having closed the app
  close(clientId: string) {
    this.clients.delete(clientId);
  }

  // Check if a client currently has the app open
  isOpen(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  // Get all currently open clients
  getOpenClients(): Client[] {
    return Array.from(this.clients.values());
  }

  hasOpenClients(): boolean {
    return this.clients.size > 0;
  }

  // Ensure the store matches the given array of clients
  ensureConnected(clients: Client[]) {
    const incomingIds = new Set(clients.map(c => c.clientId));
    // Remove clients not in the incoming list
    for (const id of Array.from(this.clients.keys())) {
      if (!incomingIds.has(id)) {
        this.clients.delete(id);
      }
    }
    // Add or update incoming clients
    for (const client of clients) {
      this.clients.set(client.clientId, client);
    }
  }
}