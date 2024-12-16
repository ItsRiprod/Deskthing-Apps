import { DeskThing } from "deskthing-client";
import { SocketData } from "deskthing-client/dist/types";
import { Channel } from "discord-rpc";

// Interface for user data received from the server
export interface UserData {
  id: string;
  username?: string;
  nick?: string;
  speaking?: boolean;
  volume?: number;
  avatar?: string;
  mute?: boolean;
  deaf?: boolean;
  profile?: string;
}

type EventUpdateCallbacks = (data: any) => void;

interface VoiceActivityDataTransport extends SocketData {
  type: "speaking_data";
  payload: { id: string; speaking: boolean };
}

interface ChannelInfoTransport extends SocketData {
  type: "channel_info";
  payload: Channel;
}

interface VoiceStateDataTransport extends SocketData {
  type: "voice_state";
  payload: { id: string; mute: boolean; deaf: boolean };
}

interface ChannelMemberDataTransport extends SocketData {
  type: "channel_member";
  request: "connect" | "disconnect";
  payload: UserData | { id: string };
}

class DiscordStore {
  private DeskThingClient: DeskThing;
  private static instance: DiscordStore;
  private listeners: (() => void)[] = [];

  /**
   * Data Callbacks
   */

  private callDataSubscriberCallbacks: EventUpdateCallbacks[] = [];
  private channelDataSubscriberCallbacks: EventUpdateCallbacks[] = [];
  // private notificationDataSubscriberCallbacks: EventUpdateCallbacks[] = [];

  private activeCallMemberData: UserData[] = [];
  //private notificationStack: userData[] = [] // Will be used later for notifications

  // Channel data and callbacks for channel updates
  private channelData: Channel | undefined;

  // Debounce flag for speaking updates
  private speakingUpdateTimeout: { [key: string]: NodeJS.Timeout } = {};

  private constructor() {
    this.DeskThingClient = DeskThing.getInstance();

    // this.listeners.push(this.DeskThingClient.on("notification_data", this.handleNotificationData))

    this.listeners.push(
      this.DeskThingClient.on("speaking_data", this.handleSpeakingData)
    );
    this.listeners.push(
      this.DeskThingClient.on("channel_info", this.handleChannelData)
    );
    this.listeners.push(
      this.DeskThingClient.on("channel_member", this.handleChannelMemberData)
    );
    this.listeners.push(
      this.DeskThingClient.on("voice_data", this.handleVoiceStateData)
    );
    this.listeners.push(
      this.DeskThingClient.on("client_data", this.handleDiscordClientData)
    );
  }

  static getInstance(): DiscordStore {
    if (!DiscordStore.instance) {
      DiscordStore.instance = new DiscordStore();
    }
    return DiscordStore.instance;
  }

  /*
   * Data Subscribers
   */

  // Subscribe to updates in channel data
  subscribeToChannelData(callback: (data: any) => void) {
    this.channelDataSubscriberCallbacks.push(callback);
    return () => {
      this.channelDataSubscriberCallbacks =
        this.channelDataSubscriberCallbacks.filter((cb) => cb !== callback);
    };
  }

  // Subscribe to updates in call data
  subscribeToCallData(callback: EventUpdateCallbacks) {
    this.callDataSubscriberCallbacks.push(callback);
    return () => {
      this.callDataSubscriberCallbacks =
        this.callDataSubscriberCallbacks.filter((cb) => cb !== callback);
    };
  }

  // subscribeToNotificationData(callback: EventUpdateCallbacks) {
  //   this.notificationDataSubscriberCallbacks.push(callback);
  //   return () => {
  //     this.notificationDataSubscriberCallbacks =
  //       this.notificationDataSubscriberCallbacks.filter(
  //         (cb) => cb !== callback
  //       );
  //   };
  // }

  /**
   * Data Publishers
   */

  // Notify all registered subscriber callbacks of the discord data update
  private publishCallData() {
    this.callDataSubscriberCallbacks.forEach((callback) =>
      callback(this.activeCallMemberData)
    );
  }

  // Notify all registered callbacks of the channel data update
  private publishChannelData() {
    this.channelDataSubscriberCallbacks.forEach((callback) =>
      callback(this.channelData)
    );
  }

  // Update the call data with new user information
  updateUserCallData(newData: UserData) {
    const existingUser = this.activeCallMemberData.find(
      (user) => user.id === newData.id
    );

    if (existingUser) {
      this.activeCallMemberData = this.activeCallMemberData.map((user) =>
        user.id === newData.id
          ? { ...existingUser, ...newData } // Preserve existing data
          : user
      );
    } else {
      // Add new user and request their full data
      this.activeCallMemberData = [...this.activeCallMemberData, newData];
      this.requestCallData(); // Refresh full user data
    }

    this.publishCallData();
  }

  // Handle incoming data from the server
  handleDiscordClientData = (data: SocketData) => {
    const payload = data.payload;

    // if (data.app !== "discord") return;

    switch (data.request) {
      case "join":
        // Just clear the list and wait for call data
        this.activeCallMemberData = [];
        this.requestCallData();
        break;

      case "refresh_call":
        // Full user list update
        if (Array.isArray(payload)) {
          this.activeCallMemberData = payload;
          this.publishCallData();
        }
        break;

      case "leave":
        this.channelData = undefined;
        this.activeCallMemberData = [];
        this.publishCallData();
        this.publishChannelData();
        break;
    }
  };

  handleChannelMemberData = (data: ChannelMemberDataTransport) => {
    const payload = data.payload;
    if (payload) {
      switch (data.request) {
        case "connect":
          this.updateUserCallData(payload);
          this.publishCallData();
          break;

        case "disconnect":
          this.activeCallMemberData = this.activeCallMemberData.filter(
            (user) => user.id !== payload.id
          );
          this.publishCallData();
          break;
      }
    }
  };

  handleChannelData = (data: ChannelInfoTransport) => {
    const payload = data.payload;
    if (payload) {
      this.channelData = payload;
      this.publishChannelData();

      if (payload.voice_states) {
        for (const voiceState of payload.voice_states) {
          if (voiceState.user) this.updateUserCallData(voiceState.user);
        }
      }
    }
  };

  handleVoiceStateData = (data: VoiceStateDataTransport) => {
    const payload = data.payload;
    if (payload) {
      this.updateUserCallData(payload);
    }
  };

  handleSpeakingData = (data: VoiceActivityDataTransport) => {
    const payload = data.payload;
    if (payload) {
      const userId = payload.id;

      // Clear existing timeout for this user if any
      if (this.speakingUpdateTimeout[userId]) {
        clearTimeout(this.speakingUpdateTimeout[userId]);
      }

      // Set new timeout
      this.speakingUpdateTimeout[userId] = setTimeout(() => {
        this.activeCallMemberData = this.activeCallMemberData.map((user) =>
          user.id === userId ? { ...user, speaking: payload.speaking } : user
        );
        this.publishCallData();
        delete this.speakingUpdateTimeout[userId];
      }, 100); // 100ms debounce
    }
  };

  // Get the current call data
  getCallData(): UserData[] {
    return this.activeCallMemberData;
  }

  // Get the current channel data
  getChannelData(): any {
    return this.channelData;
  }

  // Request the latest call data from the server
  requestCallData(): void {
    this.DeskThingClient.send({
      app: "discord",
      type: "get",
      request: "refresh_call",
      payload: { channel_id: this.channelData?.id },
    });
  }

  // Cleanup enhanced to clear timeouts
  cleanup() {
    Object.values(this.speakingUpdateTimeout).forEach((timeout) =>
      clearTimeout(timeout)
    );
    this.speakingUpdateTimeout = {};
    this.callDataSubscriberCallbacks = [];
  }
}

export default DiscordStore.getInstance();
