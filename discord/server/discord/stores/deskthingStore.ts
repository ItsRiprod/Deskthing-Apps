import { DeskThing } from "@deskthing/server";
import { CallStatusManager } from "./callStore";
import { ChatStatusManager } from "./chatStore";
import { GuildListManager } from "./guildStore";
import { NotificationStatusManager } from "./notificationStore";

export class DeskthingStore {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private callStore: CallStatusManager,
    private chatStore: ChatStatusManager,
    private guildStore: GuildListManager,
    private notificationStore: NotificationStatusManager
  ) {
    this.setupEventListeners();
  }


// Create a debounce function that uses the event type as a key
private debounce<T>(eventType: string, fn: (data: T) => void, delay: number = 500): (data: T) => void {
  return (data: T) => {
    // Clear only the timer for this specific event type
    if (this.debounceTimers.has(eventType)) {
      clearTimeout(this.debounceTimers.get(eventType)!);
      const timer = setTimeout(() => {
        fn(data);
        this.debounceTimers.delete(eventType);
      }, delay);
      
      this.debounceTimers.set(eventType, timer);
    } else {
      // First in sends immediately
      fn(data);
      const timer = setTimeout(() => {
        this.debounceTimers.delete(eventType);
      }, delay);
      this.debounceTimers.set(eventType, timer);
    }
  };
}

  private setupEventListeners(): void {
    // Call store events
    this.callStore.on("update", this.debounce("callUpdate", (status) => {
      DeskThing.send({
        type: "call",
        payload: status,
        request: "set",
      });
    }))

    this.callStore.on("speakingStateChanged", this.debounce("speakingStateChanged", (status) => {
      DeskThing.send({
        type: "call",
        payload: status,
        request: "update",
      });
    }, 10))

    // Chat store events
    this.chatStore.on("update", this.debounce("chatUpdate", (status) => {
      DeskThing.send({
        type: "chat",
        payload: status,
        request: "set",
      });
    }))

    // Guild store events
    this.guildStore.on("guildUpdate", this.debounce("guildUpdate", (status) => {
      DeskThing.send({
        type: "guildList",
        payload: status,
        request: "set",
      });
    }))

    this.guildStore.on("channelsUpdated", this.debounce("channelsUpdated", (channels) => {
      DeskThing.send({
        type: "channels",
        payload: { channels },
        request: "set",
      });
    }))

    // Notification store events
    this.notificationStore.on("statusUpdated", this.debounce("notificationStatusUpdated", (status) => {
      DeskThing.send({
        type: "notification",
        payload: status,
        request: "set",
      });
    }))

    this.notificationStore.on("notificationAdded", this.debounce("notificationAdded", (notification) => {
      DeskThing.send({
        type: "notification",
        payload: { notification },
        request: "add",
      });
    }))

    this.notificationStore.on("notificationRead", this.debounce("notificationRead", (notificationId) => {
      DeskThing.send({
        type: "notification",
        payload: { notificationId },
        request: "read",
      });
    }))
  }
}
