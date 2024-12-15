import { DeskThing } from "deskthing-client";
import { SocketData } from "deskthing-client/dist/types";

// Interface for user data received from the server
export interface userData {
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

export interface notificationData {}

type EventUpdateCallbacks = (data: userData[]) => void;

class DiscordStore {
  private DeskThingClient: DeskThing;
  private static instance: DiscordStore;
  private listeners: (() => void)[] = [];

  // Callbacks for when call data updates
  private appUpdateCallbacks: EventUpdateCallbacks[] = [];
  private activeCallMemberData: userData[] = [];
  //private notificationStack: userData[] = [] // Will be used later for notifications

  // Channel data and callbacks for channel updates
  private channelData: any = null;
  private channelUpdateCallbacks: ((data: any) => void)[] = [];

  // Debounce flag for speaking updates
  private speakingUpdateTimeout: { [key: string]: NodeJS.Timeout } = {};

  private constructor() {
    this.DeskThingClient = DeskThing.getInstance();
    // Corrected event listeners for 'data' and 'set' events
    this.listeners.push(
      this.DeskThingClient.on("data", this.handleDiscordData)
    );
    this.listeners.push(this.DeskThingClient.on("set", this.handleDiscordData));
  }

  static getInstance(): DiscordStore {
    if (!DiscordStore.instance) {
      DiscordStore.instance = new DiscordStore();
    }
    return DiscordStore.instance;
  }

  // Notify all registered callbacks of the discord data update
  private notifyDataUpdates() {
    this.appUpdateCallbacks.forEach((callback) =>
      callback(this.activeCallMemberData)
    );
  }

  // Subscribe to updates in call data
  subscribeToCallDataUpdate(callback: EventUpdateCallbacks) {
    this.appUpdateCallbacks.push(callback);
    return () => {
      this.appUpdateCallbacks = this.appUpdateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Handle incoming data from the server
  handleDiscordData = (data: SocketData) => {
    console.log("Handling discord data", data);

    if (data.app !== "discord") return;

    if (data.type === "data") {
      switch (data.request) {
        case "join":
          // Just clear the list and wait for call data
          this.activeCallMemberData = [];
          this.requestCallData();
          break;

        case "call":
          // Full user list update
          if (Array.isArray(data.payload)) {
            this.activeCallMemberData = data.payload;
            this.notifyDataUpdates();
          }
          break;

        case "voice":
          // Debounce speaking updates to prevent rapid UI changes
          if (data.payload?.[0]) {
            const voiceUpdate = data.payload[0];
            const userId = voiceUpdate.id;

            // Clear existing timeout for this user if any
            if (this.speakingUpdateTimeout[userId]) {
              clearTimeout(this.speakingUpdateTimeout[userId]);
            }

            // Set new timeout
            this.speakingUpdateTimeout[userId] = setTimeout(() => {
              this.activeCallMemberData = this.activeCallMemberData.map(
                (user) =>
                  user.id === userId
                    ? { ...user, speaking: voiceUpdate.speaking }
                    : user
              );
              this.notifyDataUpdates();
              delete this.speakingUpdateTimeout[userId];
            }, 100); // 100ms debounce
          }
          break;

        case "update":
          // User data updates (mute, deaf, etc)
          if (data.payload?.[0]) {
            this.updateCallData(data.payload[0]);
          }
          break;

        case "disconnect":
          if (data.payload?.[0]?.id) {
            this.activeCallMemberData = this.activeCallMemberData.filter(
              (user) => user.id !== data.payload[0].id
            );
            this.notifyDataUpdates();
          }
          break;

        case "leave":
          this.activeCallMemberData = [];
          this.notifyDataUpdates();
          break;
      }
    } else if (data.type === "set") {
      // Handle setting data, such as channel information
      if (data.request === "channel_banner") {
        this.channelData = data.payload;
        this.notifyChannelUpdates();
      }
    }
  };

  // Notify all registered callbacks of the channel data update
  private notifyChannelUpdates() {
    this.channelUpdateCallbacks.forEach((callback) =>
      callback(this.channelData)
    );
  }

  // Subscribe to updates in channel data
  subscribeToChannelDataUpdate(callback: (data: any) => void) {
    this.channelUpdateCallbacks.push(callback);
    return () => {
      this.channelUpdateCallbacks = this.channelUpdateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Update the call data with new user information
  async updateCallData(newData: userData) {
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

    this.notifyDataUpdates();
  }

  // Get the current call data
  getCallData(): userData[] {
    return this.activeCallMemberData;
  }

  // Get the current channel data
  getChannelData(): any {
    return this.channelData;
  }

  // Request the latest call data from the server
  requestCallData(): void {
    this.DeskThingClient.send({ app: "discord", type: "get", request: "call" });
  }

  // Cleanup enhanced to clear timeouts
  cleanup() {
    Object.values(this.speakingUpdateTimeout).forEach((timeout) =>
      clearTimeout(timeout)
    );
    this.speakingUpdateTimeout = {};
    this.appUpdateCallbacks = [];
  }
}

export default DiscordStore.getInstance();
