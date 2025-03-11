import { DeskThing } from "@deskthing/server";
import { EventEmitter } from "events";
import { ServerEvent } from "@deskthing/types";

import { DiscordAuth } from "./api/auth";
import { DiscordRPC } from "./api/rpc-client";
import { CallControls } from "./features/callControls";
import { RichPresence } from "./features/richPresence";
import { CallStatusManager } from "./features/callStatus";
import { TokenStorage } from "./utils/tokenStorage";
import {
  RPCEvents,
  RPCCommands,
  VoiceStateCreate,
  VoiceConnectionStatus,
  Channel,
  MessageObject,
  NotificationCreate,
  MessageCreate,
} from "./types/discordApiTypes";
import { DiscordConfig } from "./types/discordTypes";
import { CallParticipant, NotificationStatus } from "@shared/types/discord";
import { getEncodedImage, ImageType } from "./utils/imageFetch";
import { ChatStatusManager } from "./features/chatStatus";
import { NotificationStatusManager } from "./features/notificationStatus";

export class DiscordService extends EventEmitter {
  private auth: DiscordAuth;
  private rpc: DiscordRPC;
  private callControls: CallControls;
  private richPresence: RichPresence;
  private callStatus: CallStatusManager;
  private chatStatus: ChatStatusManager;
  private notificationStatus: NotificationStatusManager;
  private tokenStorage: TokenStorage;
  private config: DiscordConfig = {
    clientId: "",
    clientSecret: "",
    richPresence: {
      enabled: false,
      mainText: "",
      secondaryText: "",
      showTimer: false,
    },
  };

  constructor() {
    super();
    this.tokenStorage = new TokenStorage();
    this.callStatus = new CallStatusManager();
    this.chatStatus = new ChatStatusManager();
    this.notificationStatus = new NotificationStatusManager();
    this.rpc = new DiscordRPC();
    this.auth = new DiscordAuth(this.rpc, this.tokenStorage);
    this.callControls = new CallControls(this.rpc);
    this.richPresence = new RichPresence(this.rpc);
  }

  // Configuration methods
  setClientId(clientId: string): void {
    if (clientId !== this.config.clientId) {
      DeskThing.sendLog("Discord client ID updated: " + clientId);
      this.config.clientId = clientId;
      this.checkAndReauth();
    }
  }

  setClientSecret(clientSecret: string): void {
    if (clientSecret !== this.config.clientSecret) {
      DeskThing.sendLog("Discord client secret updated");
      this.config.clientSecret = clientSecret;
      this.checkAndReauth();
    }
  }

  setRichPresenceConfig(config: {
    enabled: boolean;
    mainText?: string;
    secondaryText?: string;
    showTimer?: boolean;
  }): void {
    this.config.richPresence = {
      ...this.config.richPresence,
      ...config,
    };

    if (this.rpc.isConnected && config.enabled) {
      this.updateRichPresence();
    }
  }

  private checkAndReauth(): void {
    if (this.config.clientId && this.config.clientSecret) {
      this.initialize();
    }
  }

  // Core initialization
  async initialize(): Promise<void> {
    DeskThing.sendLog("Initializing Discord integration...");

    if (!this.config.clientId || !this.config.clientSecret) {
      DeskThing.sendError(
        "Discord not initialized! Ensure the client ID and client secret are set."
      );
      return;
    }

    try {
      // Connect RPC
      await this.rpc.connect(this.config.clientId);

      // Authenticate
      await this.auth.authenticate({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      });

      this.rpc.setMaxListeners(1);

      // Setup event listeners and subscriptions
      this.setupEventListeners();

      // Initialize rich presence if enabled
      if (this.config.richPresence.enabled) {
        this.updateRichPresence();
      }

      const user = await this.rpc.updateUser();
      user && this.callStatus.updateCurrentUser(user);

      this.emit("ready");
      DeskThing.sendLog("Discord integration initialized successfully");
    } catch (error) {
      DeskThing.sendError(`Failed to initialize Discord: ${error}`);
    }
  }

  // Event listener setup
  private setupEventListeners(): void {
    // Clear any existing listeners
    DeskThing.sendWarning("ERASING ALL EVENT LISTENERS");
    this.rpc.removeAllListeners();

    // Basic events
    this.rpc.on(RPCEvents.ERROR, (error) => {
      DeskThing.sendError(`Discord RPC Error: ${error}`);
    });

    // Voice channel events
    // this.rpc.on(RPCEvents.VOICE_CHANNEL_SELECT, async (data) => {
    //   if (data.channel_id) {
    //     this.callStatus.updateChannelId(data.channel_id);
    //     const channel = (await this.rpc.request(RPCCommands.GET_CHANNEL, {
    //       channel_id: data.channel_id,
    //     })) as Channel;
    //     this.callStatus.setupNewChannel(channel);
    //     this.setupCallSpecificSubscriptions(data.channel_id);
    //     await this.rpc.updateUser()
    //     this.rpc.user && this.callStatus.updateCurrentUser(this.rpc.user)
    //   } else {
    //     this.callStatus.updateChannelId(null);
    //   }
    //   DeskThing.sendLog("Discord voice channel selection changed");
    // });

    // Voice state events
    this.rpc.on(
      RPCEvents.VOICE_STATE_CREATE,
      async (data: VoiceStateCreate) => {
        const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username,
          isMuted:
            data.mute || data.voice_state.mute || data.voice_state.self_mute,
          isDeafened: data.voice_state.deaf || data.voice_state.self_deaf,
          isSpeaking: false,
        };
        this.callStatus.updateParticipant(participant);
      }
    );

    this.rpc.on(RPCEvents.NOTIFICATION_CREATE, (notif: NotificationCreate) => {
      this.notificationStatus.addNewNotification(notif);
    });

    this.rpc.on(
      RPCEvents.VOICE_STATE_UPDATE,
      async (data: VoiceStateCreate) => {
        const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username,
          isMuted:
            data.mute || data.voice_state.mute || data.voice_state.self_mute,
          isDeafened: data.voice_state.deaf || data.voice_state.self_deaf,
          isSpeaking: false,
        };
        this.callStatus.updateParticipant(participant);
        this.rpc.updateUser();
        this.rpc.user && this.callStatus.updateCurrentUser(this.rpc.user);
      }
    );

    this.rpc.on(RPCEvents.VOICE_STATE_DELETE, (data: VoiceStateCreate) => {
      this.callStatus.removeParticipant(data.user.id);
    });

    this.rpc.on(
      RPCEvents.VOICE_CONNECTION_STATUS,
      async (data: VoiceConnectionStatus) => {
        DeskThing.sendLog(`Current state of connection ${data.state}`);
        const isConnected = data.state === "VOICE_CONNECTED";
        const serverStatus = this.callStatus.getStatus().isConnected;
        if (isConnected != serverStatus) {
          // something has changed
          this.callStatus.setConnectionStatus(isConnected);
          if (isConnected) {
            const channel = (await this.rpc.request(
              RPCCommands.GET_SELECTED_VOICE_CHANNEL
            )) as Channel;
            if (channel) {
              this.callStatus.setupNewChannel(channel);
              this.chatStatus.setupNewChannel(channel);
              this.setupCallSpecificSubscriptions(channel.id);
              await this.rpc.updateUser();
              this.rpc.user && this.callStatus.updateCurrentUser(this.rpc.user);
            }
          } else {
            this.removeCallSubscribers();

            this.callStatus.clearStatus();
          }
        }
      }
    );

    this.rpc.on(RPCEvents.MESSAGE_CREATE, async (data: MessageCreate) => {
      if (data.channel_id === this.chatStatus.getStatus().currentChannelId) {
        this.chatStatus.addNewMessage({ ...data.message, channel_id: data.channel_id });
      }
    });

    this.rpc.on(RPCEvents.SPEAKING_START, async (data: { user_id: string }) => {
      DeskThing.sendLog(`User ${data.user_id} started speaking`);
      this.callStatus.updateSpeakingStatus(data.user_id, true);
    });

    this.rpc.on(RPCEvents.SPEAKING_STOP, async (data: { user_id: string }) => {
      DeskThing.sendLog(`User ${data.user_id} stopped speaking`);
      this.callStatus.updateSpeakingStatus(data.user_id, false);
    });
    // Setup basic subscriptions
    this.setupBasicSubscriptions();
  }

  private async setupBasicSubscriptions(): Promise<void> {
    try {
      await this.rpc.subscribe(RPCEvents.VOICE_CHANNEL_SELECT);
      await this.rpc.subscribe(RPCEvents.VOICE_CONNECTION_STATUS);
      await this.rpc.subscribe(RPCEvents.NOTIFICATION_CREATE);
    } catch (error) {
      DeskThing.sendError(`Failed to set up RPC subscriptions: ${error}`);
    }
  }
  private async setupCallSpecificSubscriptions(
    channelId: string
  ): Promise<void> {
    try {
      this.rpc.subscribe(RPCEvents.VOICE_STATE_UPDATE, channelId);
      this.rpc.subscribe(RPCEvents.VOICE_STATE_DELETE, channelId);
      this.rpc.subscribe(RPCEvents.MESSAGE_CREATE, channelId);
      this.rpc.subscribe(RPCEvents.SPEAKING_START, channelId);
      this.rpc.subscribe(RPCEvents.SPEAKING_STOP, channelId);
    } catch (error) {
      DeskThing.sendError(`Failed to set up call subscriptions: ${error}`);
    }
  }
  private async removeCallSubscribers(): Promise<void> {
    try {
      this.rpc.unsubscribe(RPCEvents.VOICE_STATE_UPDATE);
      this.rpc.unsubscribe(RPCEvents.VOICE_STATE_DELETE);
      this.rpc.unsubscribe(RPCEvents.MESSAGE_CREATE);
      this.rpc.unsubscribe(RPCEvents.SPEAKING_START);
      this.rpc.unsubscribe(RPCEvents.SPEAKING_STOP);
    } catch (error) {
      DeskThing.sendError(`Failed to set up call subscriptions: ${error}`);
    }
  }

  private async setupChatSpecificSubscriptions(
    channelId: string
  ): Promise<void> {
    try {
      await this.rpc.subscribe(RPCEvents.MESSAGE_CREATE, channelId);
    } catch (error) {
      DeskThing.sendError(`Failed to set up chat subscriptions: ${error}`);
    }
  }

  // Rich Presence methods
  async updateRichPresence(): Promise<void> {
    if (!this.config.richPresence.enabled || !this.rpc.isConnected) {
      return;
    }

    try {
      await this.richPresence.setActivity({
        primary: this.config.richPresence.mainText,
        secondary: this.config.richPresence.secondaryText,
        timer: this.config.richPresence.showTimer,
      });
      DeskThing.sendLog("Rich presence updated");
    } catch (error) {
      DeskThing.sendError(`Failed to update rich presence: ${error}`);
    }
  }

  // Voice control methods - delegate to CallControls
  async mute(): Promise<void> {
    return this.callControls.mute();
  }

  async unmute(): Promise<void> {
    return this.callControls.unmute();
  }

  async toggleMute(): Promise<void> {
    console.log(this.rpc.eventNames());
    return this.callControls.toggleMute();
  }

  async deafen(): Promise<void> {
    console.log(this.rpc.eventNames());
    return this.callControls.deafen();
  }

  async undeafen(): Promise<void> {
    return this.callControls.undeafen();
  }

  async toggleDeafen(): Promise<void> {
    console.log(this.rpc.eventNames());
    return this.callControls.toggleDeafen();
  }

  async disconnect(): Promise<void> {
    return this.callControls.disconnect();
  }

  async selectTextChannel(channelId: string | undefined | null) {
    if (channelId) {
      const channel = (await this.rpc.request(RPCCommands.GET_CHANNEL, {
        channel_id: channelId,
      })) as Channel;
      if (channel) {
        this.chatStatus.updateChannelId(channelId);
        this.setupChatSpecificSubscriptions(channelId);
      } else {
        DeskThing.sendWarning(
          "Failed to select text channel, channel not found"
        );
      }
    } else {
      this.chatStatus.updateChannelId(null);
    }
  }

  async expandChat() {
    this.chatStatus.setChatExpand(true);
  }

  async collapseChat() {
    this.chatStatus.setChatExpand(false);
  }

  markNotificationAsRead(notificationId: string | undefined) {
    notificationId &&
      this.notificationStatus.markNotificationAsRead(notificationId);
  }

  markAllNotificationsAsRead() {
    this.notificationStatus.markAllNotificationsAsRead();
  }

  // Utility methods
  getCallStatus() {
    return this.callStatus.getStatus();
  }

  getChatStatus() {
    return this.chatStatus.getStatus();
  }

  getNotificationStatus() {
    return this.notificationStatus.getStatus();
  }

  // Utility methods
  sendCallStatus() {
    return this.callStatus.debounceUpdateClient();
  }

  sendChatStatus() {
    return this.chatStatus.updateClient();
  }

  sendNotificationStatus() {
    return this.notificationStatus.updateClient();
  }

  isConnected(): boolean {
    return this.rpc.isConnected;
  }

  // Reinitialize methods
  reAuth(): Promise<void> {
    return this.initialize();
  }

  rePresence(): Promise<void> {
    return this.updateRichPresence();
  }
}

// Export the singleton instance
export default new DiscordService();
