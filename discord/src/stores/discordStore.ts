import { DeskThing } from "deskthing-client";
import { SocketData } from "deskthing-client/dist/types";

export interface userData {
  id: string;
  username?: string | undefined;
  nick?: string | undefined;
  speaking?: boolean | undefined;
  volume?: number | undefined;
  avatar?: string | undefined;
  mute?: boolean | undefined;
  deaf?: boolean | undefined;
  profile?: string | undefined;
}

export interface notificationData {}

type EventUpdateCallbacks = (data: userData[]) => void;

class DiscordStore {
  private DeskThingClient: DeskThing;
  private static instance: DiscordStore;
  private listeners: (() => void)[] = [];

  private appUpdateCallbacks: EventUpdateCallbacks[] = [];
  private activeCallMemberData: userData[] = [];
  //private notificationStack: userData[] = [] // Will be used later for notifications

  private constructor() {
    this.DeskThingClient = DeskThing.getInstance();
    this.listeners.push(this.DeskThingClient.on("get", this.handleDiscordData));
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

  subscribeToCallDataUpdate(callback: EventUpdateCallbacks) {
    this.appUpdateCallbacks.push(callback);
    return () => {
      this.appUpdateCallbacks = this.appUpdateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  handleDiscordData(data: SocketData) {
    console.log("Handling discord data");
    if (data.type == "data") {
      switch (data.request) {
        case "join":
          this.activeCallMemberData = [];
          this.requestCallData();
          break;
        case "leave":
          this.activeCallMemberData = [];
          break;
        case "disconnect":
          this.requestCallData();
          break;
        case "update":
          if (data.payload) this.updateCallData(data.payload[0]);
          break;
        case "voice":
          if (data.payload) this.updateCallData(data.payload[0]);
          break;
        case "call":
          this.activeCallMemberData = data.payload as userData[];
          break;
        default:
          break;
      }

      console.log("Recieved new discord data");
    }

    this.notifyDataUpdates();
  }

  async updateCallData(newData: userData) {
    this.activeCallMemberData = this.activeCallMemberData.map((user) =>
      user.id === newData.id ? { ...user, ...newData } : user
    );

    // If the user ID is not present in the array, add the new user
    if (
      !this.activeCallMemberData.some((user) => user.id === newData.id) &&
      newData.id
    ) {
      this.activeCallMemberData = [newData, ...this.activeCallMemberData];
    }

    this.notifyDataUpdates();
  }

  getCallData(): userData[] {
    return this.activeCallMemberData;
  }

  requestCallData(): void {
    this.DeskThingClient.send({ app: "discord", type: "get", request: "call" });
  }

  cleanup() {
    //this.listeners.forEach(removeListener => removeListener())
    this.appUpdateCallbacks = [];
  }
}

export default DiscordStore.getInstance();
