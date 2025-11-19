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
import { CallParticipant } from "../../../shared/types/discord";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { EventEmitter } from "node:events";

type RPCEventTypes = {
  [RPCEvents.READY]: { user: User | undefined };
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
  authenticated: [{ authStatus: boolean }];
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
  private subscriptions: Record<string, Subscription & { channelId?: string }> =
    {};
  private eventHandlers: Record<string, Set<EventCallback>> = {};
  public user: CallParticipant | undefined = undefined;
  private loggingInID: string | undefined;

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
            console.log(`Registering callback for event: ${event}`);
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
        console.warn(`Error updating user: ${error}`);
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
      console.log("Already logging in with this client ID");
      return;
    } else {
      this.loggingInID = clientId;
    }
    console.log(
      `Attempting to connect to Discord RPC with clientId: ${clientId}`
    );

    // Disconnect existing client if connected
    if (this.rpcClient) {
      console.log("Existing RPC client found, disconnecting...");
      this.disconnect();
    }

    try {
      const client = new Client({ transport: "ipc" });
      console.log("Created new Discord RPC client");

      await new Promise<void>((resolve, reject) => {
        client.on("ready", async () => {
          this.rpcClient = client as ActualClient;
          this._isConnected = true;
          this.emit(RPCEvents.READY, { user: client.user });
          console.log("Connected to Discord RPC");
          resolve();
        });

        client.on("error", (error) => {
          this._isConnected = false;
          console.error(`Discord RPC error: ${error}`);
          reject(error);
        });

        client.on("close", (error) => {
          this._isConnected = false;
          console.error(`Discord RPC error: ${error}`);
          reject(error);
        });

        client.on("disconnected", () => {
          this._isConnected = false;
          console.log("Discord RPC disconnected");
          this.rpcClient = null;
        });

        client.login({ clientId }).catch(reject);

        console.log("Logging in to Discord RPC...");
      });
    } catch (error) {
      this._isConnected = false;
      console.error(`Failed to connect to Discord RPC: ${error}`);
      throw error;
    } finally {
      this.loggingInID = undefined;
    }
  }

  async disconnect(): Promise<void> {
    if (this.rpcClient) {
      try {
        console.log("Destroying RPC client...");
        this.rpcClient.destroy();
        this.rpcClient = null;
        this._isConnected = false;
        console.log("Disconnected from Discord RPC");
      } catch (error) {
        console.error(`Error disconnecting from Discord RPC: ${error}`);
      }
    } else {
      console.log("No RPC client to disconnect from.");
    }
  }

  async request(cmd: string, args?: Object): Promise<any> {
    try {
      this.ensureConnected();
      console.log(
        `Sending request to Discord RPC: ${cmd}, args: ${JSON.stringify(args)}`
      );
      return this.rpcClient!.request(cmd, args);
    } catch (error) {
      console.error(`Error in RPC request ${cmd}: ${error}`);
      return null;
    }
  }

  private async resubscribeAll(): Promise<void> {
    console.debug("Resubscribing to all events...");
    for (const event in this.subscriptions) {
      console.debug(`Resubscribing to ${event}...`);
      await this.subscribe(
        event as RPCEvents,
        this.subscriptions[event].channelId
      );
    }
    for (const event in this.eventHandlers) {
      console.debug(`Re-registering callback for event: ${event}`);
      this.onRPCEvent(event as RPCEvents);
    }
  }

  /** Subscribes to the RPC directly */
  async subscribe(
    event: RPCEvents,
    channelId?: string,
    attempt = 1
  ): Promise<boolean> {
    try {
      if (!this.rpcClient) {
        console.error(`RPC client is not connected`);
        // This is to ensure that the listener is still registered so it can be subscribed to once the client connects
        this.subscriptions[event] = {
          channelId,
          unsubscribe: async () => true,
        };
        return false;
      }
      this.ensureConnected();
      if (this.subscriptions[event]) {
        await this.unsubscribe(event);
      }
      console.log(`Subscribing to ${event} ${channelId}...`);
      const subscription = await Promise.race([
        this.rpcClient.subscribe(event, {
          channel_id: channelId,
        }),
        new Promise((resolve, _) =>
          setTimeout(() => resolve(), 5000)
        ) as Promise<void>,
      ]);
      if (!subscription) {
        this.subscriptions[event] = {
          unsubscribe: async () => true,
          channelId,
        };
        console.error(`Failed to subscribe to ${event}. Timed out!`);
        if (attempt < 5) {
          const nextAttempt = attempt + 1;
          const delay = Math.min(5000, 500 * nextAttempt);
          setTimeout(() => {
            this.subscribe(event, channelId, nextAttempt).catch((error) =>
              console.error(
                `Retry ${nextAttempt} failed for ${event}: ${String(error)}`
              )
            );
          }, delay);
        }
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.subscriptions[event] = { ...subscription, channelId };
      console.log(
        `Subscribed to ${event}${channelId ? ` for channel ${channelId}` : ""}`
      );
      return true;
    } catch (error) {
      this.subscriptions[event] = { unsubscribe: async () => true, channelId };
      console.error(`Error subscribing to ${event}: ${error}`);
      if (attempt < 5) {
        const nextAttempt = attempt + 1;
        const delay = Math.min(5000, 500 * nextAttempt);
        setTimeout(() => {
          this.subscribe(event, channelId, nextAttempt).catch((err) =>
            console.error(`Retry ${nextAttempt} failed for ${event}: ${String(err)}`)
          );
        }, delay);
        return false;
      }
      throw error
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
        console.log(`Unsubscribed from ${event}`);
      } else {
        console.log(`No active subscription found for event: ${event}`);
      }
    } catch (error) {
      console.error(`Error unsubscribing from ${event}: ${error}`);
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
    });
    await this.updateUser();
    await this.resubscribeAll();
    this.emit('authenticated', { authStatus: true })
    return response;
  };

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
      console.log(`Setting voice settings: ${JSON.stringify(settings)}`);
      await this.rpcClient!.setVoiceSettings(settings as VoiceSettings);
      this.updateUser();
    } catch (error) {
      console.error(`Error setting voice settings: ${error}`);
      throw error;
    }
  }

  async getVoiceSettings(): Promise<VoiceSettings> {
    try {
      this.ensureConnected();
      console.log("Getting voice settings");
      return this.rpcClient!.getVoiceSettings();
    } catch (error) {
      console.error(`Error getting voice settings: ${error}`);
      throw error;
    }
  }

  async setActivity(activity: any): Promise<void> {
    try {
      this.ensureConnected();
      console.log(`Setting activity: ${JSON.stringify(activity)}`);
      await this.rpcClient!.setActivity(activity);
    } catch (error) {
      console.error(`Error setting activity: ${error}`);
      throw error;
    }
  }

  async selectVoiceChannel(channelId: string | undefined): Promise<void> {
    try {
      this.ensureConnected();
      console.log(`Selecting voice channel: ${channelId}`);
      await this.rpcClient!.selectVoiceChannel(channelId as string);
    } catch (error) {
      console.error(`Error selecting voice channel: ${error}`);
      throw error;
    }
  }

  private ensureConnected(): void {
    if (!this.rpcClient || !this._isConnected) {
      console.log("RPC client is not connected");
      throw new Error("RPC client is not connected");
    }
  }
}
