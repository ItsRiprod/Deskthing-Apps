import { DeskThing } from "@deskthing/server";
import { DiscordRPCStore } from "./rpcStore";

export interface RichPresenceOptions {
  primary?: string;
  secondary?: string;
  timer?: boolean;
  image1?: string;
  image2?: string;
}

export class RichPresence {
  private currentActivity: RichPresenceOptions = {};
  private rpc: DiscordRPCStore;
  
  constructor(rpc: DiscordRPCStore) {
    this.rpc = rpc;
  }

  async setActivity(options: RichPresenceOptions): Promise<void> {
    try {
      if (!this.rpc.isConnected) {
        throw new Error("RPC client is not connected");
      }

      const startTimestamp = options.timer ? Date.now() : undefined;

      await this.rpc.setActivity({
        details: options.primary,
        state: options.secondary,
        startTimestamp,
        largeImageKey: options.image1,
        smallImageKey: options.image2,
        instance: false,
      });
      
      console.log("Rich presence updated");
      this.currentActivity = options;
    } catch (error) {
      console.error(`Failed to update rich presence: ${error}`);
    }
  }

  async resetActivity(): Promise<void> {
    if (this.currentActivity) {
      await this.setActivity(this.currentActivity)
    }
  }

  async clearActivity(): Promise<void> {
    try {
      if (!this.rpc.isConnected) {
        return;
      }
      
      await this.rpc.setActivity({});
      console.log("Rich presence cleared");
      this.currentActivity = {};
    } catch (error) {
      console.error(`Failed to clear rich presence: ${error}`);
    }
  }
}
