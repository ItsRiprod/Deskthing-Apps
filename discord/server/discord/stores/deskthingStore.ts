import { createDeskThing } from '@deskthing/server'
import { CallStatusManager } from './callStore'
import { ChatStatusManager } from './chatStore'
import { GuildListManager } from './guildStore'
import { NotificationStatusManager } from './notificationStore'
import { DiscordEvents, ToClientTypes, ToServerTypes } from '../../../shared/types/transit'
import { CallControls } from './controlsStore'

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>()

export class DeskthingStore {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private callStore: CallStatusManager,
    private chatStore: ChatStatusManager,
    private guildStore: GuildListManager,
    private notificationStore: NotificationStatusManager,
    private controlStore: CallControls,
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
        type: DiscordEvents.CALL,
        payload: status,
        request: "set",
      });
    }))

    this.callStore.on("speakingStateChanged", this.debounce("speakingStateChanged", (status) => {
      DeskThing.send({
        type: DiscordEvents.CALL,
        payload: status,
        request: "update",
      });
    }, 10))

    // Chat store events
    this.chatStore.on("update", this.debounce("chatUpdate", (status) => {
      DeskThing.send({
        type: DiscordEvents.CHAT,
        payload: status,
        request: "set",
      });
    }))

    // Guild store events
    this.guildStore.on("guildUpdate", this.debounce("guildUpdate", (status) => {
      console.debug('Sending updated guilds')
      DeskThing.send({
        type: DiscordEvents.GUILD_LIST,
        payload: status,
        request: "set",
      });
    }))
    

    this.guildStore.on("channelsUpdated", this.debounce("channelsUpdated", (channels) => {
      DeskThing.send({
        type: DiscordEvents.CHANNELS,
        payload: { channels },
        request: "set",
      });
    }))

    // Notification store events
    this.notificationStore.on("statusUpdated", this.debounce("notificationStatusUpdated", (status) => {
      DeskThing.send({
        type: DiscordEvents.NOTIFICATION,
        payload: status,
        request: "set",
      });
    }))

    this.notificationStore.on("notificationAdded", this.debounce("notificationAdded", (notification) => {
      DeskThing.send({
        type: DiscordEvents.NOTIFICATION,
        payload: { notification },
        request: "add",
      });
    }))

    this.notificationStore.on("notificationRead", this.debounce("notificationRead", (notificationId) => {
      DeskThing.send({
        type: DiscordEvents.NOTIFICATION,
        payload: { notificationId },
        request: "read",
      });
    }))

    this.controlStore.on("voiceStateChanged", this.debounce("voiceStateChanged", (voiceState) => {
      DeskThing.send({
        type: DiscordEvents.VOICE_STATE,
        payload: voiceState,
        request: "update",
      });
    }))
  }
}
