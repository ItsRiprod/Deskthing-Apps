import { Client, Subscription, User, VoiceSettings } from "discord-rpc";
import { DeskThing } from "@deskthing/server";
import { EventEmitter } from "events";
import { RPCEvents } from "../types/discordApiTypes";
import { CallParticipant } from "@shared/types/discord";
import { getEncodedImage, ImageType } from "../utils/imageFetch";

type ActualClient = Client & {
  request(cmd: string, args?: Object, evt?: string): Promise<any>;
  unsubscribe(
    event: string,
    args: { channel_id: string | undefined }
  ): Promise<boolean>;
};

export class DiscordRPC extends EventEmitter {
  private rpcClient: ActualClient | null = null;
  private _isConnected: boolean = false;
  private subscriptions: Map<string, Subscription> = new Map();
  public user: CallParticipant | null = null;
  constructor() {
    super();
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  updateUser = async (): Promise<CallParticipant | undefined> => {
    const update = async () => {
      if (this.rpcClient?.user) {
        const voiceSettings = await this.rpcClient.getVoiceSettings();
        this.user = {
          id: this.rpcClient.user.id,
          profileUrl: await getEncodedImage(
            this.rpcClient.user.avatar,
            ImageType.UserAvatar,
            this.rpcClient.user.id
          ),
          username: this.rpcClient.user.username || this.rpcClient.user.id,
          isDeafened: voiceSettings.deaf,
          isMuted: voiceSettings.deaf || voiceSettings.mute,
          isSpeaking: false,
        };
        return this.user;
      }
    };
    if (this.rpcClient?.user) {
      try {
        return await update()
      } catch (error) {
        DeskThing.sendError(`Error updating user: ${error}`);
      }
    } else {
      // Wait a second before trying again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (this.rpcClient?.user) {
        return await update()
      }
    }
  };

  async connect(clientId: string): Promise<void> {
    DeskThing.sendLog(
      `Attempting to connect to Discord RPC with clientId: ${clientId}`
    );
    // Disconnect existing client if connected
    if (this.rpcClient) {
      DeskThing.sendLog("Existing RPC client found, disconnecting...");
      this.disconnect();
    }

    try {
      const client = new Client({ transport: "ipc" });
      DeskThing.sendLog("Created new Discord RPC client");

      await new Promise<void>((resolve, reject) => {
        client.on("ready", () => {
          this.rpcClient = client as ActualClient;
          this._isConnected = true;
          if (client.user) {
            this.updateUser();
          }
          DeskThing.sendLog("Connected to Discord RPC");
          resolve();
        });

        client.on("error", (error) => {
          this._isConnected = false;
          DeskThing.sendError(`Discord RPC error: ${error}`);
          reject(error);
        });

        client.on("close", (error) => {
          this._isConnected = false;
          DeskThing.sendDebug(`Discord RPC disconnected: ${error}`);
          DeskThing.sendError(`Discord RPC error: ${error}`);
          reject(error);
        });

        client.on("ERROR", (error) => {
          DeskThing.sendError(`Discord RPC error: ${error}`);
        });

        client.on("disconnected", () => {
          this._isConnected = false;
          DeskThing.sendLog("Discord RPC disconnected");
          this.rpcClient = null;
        });

        client.login({ clientId }).catch(reject);
        DeskThing.sendLog("Logging in to Discord RPC...");
      });
    } catch (error) {
      this._isConnected = false;
      DeskThing.sendError(`Failed to connect to Discord RPC: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.rpcClient) {
      try {
        DeskThing.sendLog("Destroying RPC client...");
        this.rpcClient.destroy();
        this.rpcClient = null;
        this._isConnected = false;
        DeskThing.sendLog("Disconnected from Discord RPC");
      } catch (error) {
        DeskThing.sendError(`Error disconnecting from Discord RPC: ${error}`);
      }
    } else {
      DeskThing.sendLog("No RPC client to disconnect from.");
    }
  }

  async request(cmd: string, args?: Object): Promise<any> {
    try {
      this.ensureConnected();
      DeskThing.sendLog(
        `Sending request to Discord RPC: ${cmd}, args: ${JSON.stringify(args)}`
      );
      return this.rpcClient!.request(cmd, args);
    } catch (error) {
      DeskThing.sendError(`Error in RPC request ${cmd}: ${error}`);
      return null;
    }
  }

  async subscribe(event: RPCEvents, channelId?: string): Promise<void> {
    try {
      if (!this.rpcClient) {
        DeskThing.sendError(`RPC client is not connected`);
        return;
      }
      this.ensureConnected();
      if (this.subscriptions.has(`${event}`)) {
        await this.unsubscribe(event);
      } else {
        DeskThing.sendLog(`Nothing to unsubscribe from ${event}`);
      }
      DeskThing.sendLog(`Subscribing to ${event} ${channelId}...`);
      const subscription = await Promise.race([
        this.rpcClient.subscribe(event, {
          channel_id: channelId,
        }),
        new Promise((resolve, _) =>
          setTimeout(() => resolve(), 5000)
        ) as Promise<void>,
      ]);
      if (!subscription) {
        DeskThing.sendError(`Failed to subscribe to ${event}. Timed out!`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.subscriptions.set(`${event}`, subscription);
      DeskThing.sendLog(
        `Subscribed to ${event}${channelId ? ` for channel ${channelId}` : ""}`
      );
    } catch (error) {
      DeskThing.sendError(`Error subscribing to ${event}: ${error}`);
    }
  }

  async unsubscribe(event: RPCEvents): Promise<void> {
    try {
      this.ensureConnected();
      const subscription = this.subscriptions.get(`${event}`);
      if (subscription) {
        await subscription.unsubscribe();
        this.subscriptions.delete(`${event}`);
        DeskThing.sendLog(`Unsubscribed from ${event}`);
      } else {
        DeskThing.sendLog(`No active subscription found for event: ${event}`);
      }
    } catch (error) {
      DeskThing.sendError(`Error unsubscribing from ${event}: ${error}`);
    }
  }

  on(event: RPCEvents, callback: (...args: any[]) => void): this {
    if (!this.rpcClient) {
      DeskThing.sendWarning(
        `Attempted to register event ${event} but client is not connected`
      );
      return this;
    }
    DeskThing.sendLog(`Registering callback for event: ${event}`);
    this.rpcClient.on(event, (data) => {
      callback(data);
    });
    return this;
  }

  removeAllListeners(event?: string): this {
    if (this.rpcClient) {
      DeskThing.sendLog(`Removing all listeners for event: ${event}`);
      if (event) {
        this.rpcClient.removeAllListeners(event);
      } else {
        DeskThing.sendLog("Removing all listeners for all events");
        this.rpcClient.removeAllListeners();
      }
    }
    return super.removeAllListeners(event);
  }

  async setVoiceSettings(settings: Partial<VoiceSettings>): Promise<void> {
    try {
      this.ensureConnected();
      DeskThing.sendLog(`Setting voice settings: ${JSON.stringify(settings)}`);
      await this.rpcClient!.setVoiceSettings(settings as VoiceSettings);
      this.updateUser();
    } catch (error) {
      DeskThing.sendError(`Error setting voice settings: ${error}`);
      throw error;
    }
  }

  async getVoiceSettings(): Promise<VoiceSettings> {
    try {
      this.ensureConnected();
      DeskThing.sendLog("Getting voice settings");
      return this.rpcClient!.getVoiceSettings();
    } catch (error) {
      DeskThing.sendError(`Error getting voice settings: ${error}`);
      throw error;
    }
  }

  async setActivity(activity: any): Promise<void> {
    try {
      this.ensureConnected();
      DeskThing.sendLog(`Setting activity: ${JSON.stringify(activity)}`);
      await this.rpcClient!.setActivity(activity);
    } catch (error) {
      DeskThing.sendError(`Error setting activity: ${error}`);
      throw error;
    }
  }

  async selectVoiceChannel(channelId: string | undefined): Promise<void> {
    try {
      this.ensureConnected();
      DeskThing.sendLog(`Selecting voice channel: ${channelId}`);
      await this.rpcClient!.selectVoiceChannel(channelId as string);
    } catch (error) {
      DeskThing.sendError(`Error selecting voice channel: ${error}`);
      throw error;
    }
  }

  private ensureConnected(): void {
    if (!this.rpcClient || !this._isConnected) {
      DeskThing.sendLog("RPC client is not connected");
      throw new Error("RPC client is not connected");
    }
  }
}
