import { DeskThing } from "@deskthing/server";
import { DiscordRPC } from "../api/rpc-client";

export interface RichPresenceOptions {
  primary?: string;
  secondary?: string;
  timer?: boolean;
  image1?: string;
  image2?: string;
}

export class RichPresence {
  private rpc: DiscordRPC;
  
  constructor(rpc: DiscordRPC) {
    this.rpc = rpc;
  }

  async setActivity({ primary, secondary, timer, image1, image2 }: RichPresenceOptions): Promise<void> {
    try {
      if (!this.rpc.isConnected) {
        throw new Error("RPC client is not connected");
      }

      const startTimestamp = timer ? Date.now() : undefined;

      await this.rpc.setActivity({
        details: primary,
        state: secondary,
        startTimestamp,
        largeImageKey: image1,
        smallImageKey: image2,
        instance: false,
      });
      
      DeskThing.sendLog("Rich presence updated");
    } catch (error) {
      DeskThing.sendError(`Failed to update rich presence: ${error}`);
      throw error;
    }
  }

  async clearActivity(): Promise<void> {
    try {
      if (!this.rpc.isConnected) {
        return;
      }
      
      await this.rpc.setActivity({});
      DeskThing.sendLog("Rich presence cleared");
    } catch (error) {
      DeskThing.sendError(`Failed to clear rich presence: ${error}`);
    }
  }
}
