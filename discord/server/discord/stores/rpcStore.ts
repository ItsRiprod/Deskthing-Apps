import { Client, Subscription, User, VoiceSettings } from "discord-rpc";
import { DeskThing } from "@deskthing/server";
import {
  MessageObject,
  Guild,
  Channel,
  NotificationCreate,
  RPCEvents,
  VoiceStateCreate,
} from "../types/discordApiTypes";
import {
  CallParticipant,
  CallStatus,
  ChatStatus,
  NotificationStatus,
} from "@shared/types/discord";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { EventEmitter } from "node:events";

type RPCEventTypes = {
  [RPCEvents.READY]: { user: User };
  [RPCEvents.ERROR]: { code: number; message: string };
  [RPCEvents.GUILD_STATUS]: { guild: Guild };
  [RPCEvents.GUILD_CREATE]: Guild;
  [RPCEvents.CHANNEL_CREATE]: Channel;
  [RPCEvents.VOICE_CHANNEL_SELECT]: {
    channel_id: string | null;
    guild_id: string | null;
  };
  [RPCEvents.VOICE_STATE_CREATE]: VoiceStateCreate;
  [RPCEvents.VOICE_STATE_UPDATE]: VoiceStateCreate;
  [RPCEvents.VOICE_STATE_DELETE]: VoiceStateCreate;
  [RPCEvents.VOICE_SETTINGS_UPDATE]: VoiceSettings;
  [RPCEvents.VOICE_CONNECTION_STATUS]: { state: string; hostname: string };
  [RPCEvents.SPEAKING_START]: { user_id: string };
  [RPCEvents.SPEAKING_STOP]: { user_id: string };
  [RPCEvents.MESSAGE_CREATE]: { message: MessageObject; channel_id: string };
  [RPCEvents.MESSAGE_UPDATE]: { message: MessageObject; channel_id: string };
  [RPCEvents.MESSAGE_DELETE]: { message_id: string; channel_id: string };
  [RPCEvents.NOTIFICATION_CREATE]: NotificationCreate;
  [RPCEvents.ACTIVITY_JOIN]: { secret: string };
  [RPCEvents.ACTIVITY_SPECTATE]: { secret: string };
  [RPCEvents.ACTIVITY_JOIN_REQUEST]: { user: User };
};
type RPCEmitterTypes = {
  [T in keyof RPCEventTypes]: [RPCEventTypes[T]];
} & {
  newListener: [event: string | symbol, listener: (channelId?: string) => void];
  removeListener: [event: string | symbol, listener: (...args: any[]) => void];
};

type ActualClient = Client & {
  request(cmd: string, args?: Object, evt?: string): Promise<any>;
  unsubscribe(
    event: string,
    args: { channel_id: string | undefined }
  ): Promise<boolean>;
};

type EventCallback = (...args: any[]) => void;

export class DiscordRPCStore extends EventEmitter<RPCEmitterTypes> {
  private rpcClient: ActualClient | null = null;
  private _isConnected: boolean = false;
  private subscriptions: Record<string, Subscription & { channelId?: string }> = {};
  private eventHandlers: Record<string, Set<EventCallback>> = {};
  public user: CallParticipant | null = null;
  private loggingInID: string | undefined

  constructor() {
    super();
    this.on(
      "newListener",
      (event: string | symbol, listener: (...args: any[]) => void) => {
        if (
          typeof event === "string" &&
          Object.values(RPCEvents).includes(event as RPCEvents)
        ) {
          if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = new Set();
          }
          this.eventHandlers[event].add(listener);
          if (this.rpcClient) {
            DeskThing.sendLog(`Registering callback for event: ${event}`);
            this.rpcClient.on(event, (data) => {
              this.eventHandlers[event]?.forEach((handler) => handler(data));
            });
            this.onRPCEvent(event as RPCEvents);
          }
        }
      }
    );

    this.on(
      "removeListener",
      (event: string | symbol, listener: (...args: any[]) => void) => {
        if (typeof event === "string") {
          const handlers = this.eventHandlers[event];
          if (handlers) {
            handlers.delete(listener);
            if (handlers.size === 0) {
              delete this.eventHandlers[event];
              this.offRPCEvent(event as RPCEvents, listener);
            }
          }
        }
      }
    );
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
        return await update();
      } catch (error) {
        DeskThing.sendWarning(`Error updating user: ${error}`);
      }
    } else {
      // Wait a second before trying again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (this.rpcClient?.user) {
        return await update();
      }
    }
  };

  async connect(clientId: string): Promise<void> {
    if (this.loggingInID == clientId) {
      DeskThing.sendLog("Already logging in with this client ID");
      return
    } else {
      this.loggingInID = clientId
    }
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
        client.on("ready", async () => {
          this.rpcClient = client as ActualClient;
          this._isConnected = true;
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
    } finally {
      this.loggingInID = undefined
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

  private async resubscribeAll(): Promise<void> {
    DeskThing.sendDebug("Resubscribing to all events...");
    for (const event in this.subscriptions) {
      DeskThing.sendDebug(`Resubscribing to ${event}...`);
      await this.subscribe(event as RPCEvents, this.subscriptions[event].channelId);
    }
    for (const event in this.eventHandlers) {
      DeskThing.sendDebug(`Re-registering callback for event: ${event}`);
      this.onRPCEvent(event as RPCEvents);
    }
  }

  /** Subscribes to the RPC directly */
  async subscribe(event: RPCEvents, channelId?: string): Promise<void> {
    try {
      if (!this.rpcClient) {
        DeskThing.sendError(`RPC client is not connected`);
        // This is to ensure that the listener is still registered so it can be subscribed to once the client connects
        this.subscriptions[event] = { channelId, unsubscribe: async () => true }
        return;
      }
      this.ensureConnected();
      if (this.subscriptions[event]) {
        await this.unsubscribe(event);
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
      this.subscriptions[event] = { ...subscription, channelId };
      DeskThing.sendLog(
        `Subscribed to ${event}${channelId ? ` for channel ${channelId}` : ""}`
      );
    } catch (error) {
      this.subscriptions[event] = { unsubscribe: async () => true, channelId };
      DeskThing.sendError(`Error subscribing to ${event}: ${error}`);
    }
  }

  /** Unsubscribes from the RPC directly */
  async unsubscribe(event: RPCEvents): Promise<void> {
    try {
      this.ensureConnected();
      const subscription = this.subscriptions[event];
      if (subscription) {
        await subscription.unsubscribe();
        delete this.subscriptions[event];
        DeskThing.sendLog(`Unsubscribed from ${event}`);
      } else {
        DeskThing.sendLog(`No active subscription found for event: ${event}`);
      }
    } catch (error) {
      DeskThing.sendError(`Error unsubscribing from ${event}: ${error}`);
    }
  }
  private rpcListener<T extends keyof RPCEventTypes>(
    event: T,
    data: RPCEventTypes[T]
  ) {
    if (data) {
      // A bit cheeky - but it should always be type-safe if data is always type-safe
      this.emit(event, ...([data] as Parameters<typeof this.emit>[1]));
    }
  }

  private onRPCEvent<T extends RPCEvents>(event: T) {
    this.rpcClient?.on(event, (data: RPCEventTypes[T]) => {
      this.rpcListener<T>(event, data);
    });
    return () => this.offRPCEvent(event);
  }

  public authenticate = async (token: string) => {
    const response = await this.request("AUTHENTICATE", {
      access_token: token,
    })
    await this.updateUser();
    await this.resubscribeAll();

    return response
  }

  private offRPCEvent<T extends RPCEvents>(event: T, listener?: () => void) {
    this.rpcClient?.off(
      event,
      listener || ((data) => this.rpcListener(event, data))
    );
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.eventHandlers[event];
      if (this.rpcClient) {
        this.rpcClient.removeAllListeners(event);
        this.unsubscribe(event as RPCEvents);
      }
    } else {
      this.eventHandlers = {};
      if (this.rpcClient) {
        this.rpcClient.removeAllListeners();
        for (const event in this.subscriptions) {
          this.unsubscribe(event as RPCEvents);
        }
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
