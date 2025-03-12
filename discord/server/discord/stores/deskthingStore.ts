
import { DeskThing } from "@deskthing/server";
import { CallStatusManager } from "./callStore";
import { ChatStatusManager } from "./chatStore";
import { GuildListManager } from "./guildStore";
import { NotificationStatusManager } from "./notificationStore";

export class DeskthingStore {
  constructor(
    private callStore: CallStatusManager,
    private chatStore: ChatStatusManager,
    private guildStore: GuildListManager,
    private notificationStore: NotificationStatusManager
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Call store events
    this.callStore.on('update', (status) => {
      DeskThing.send({
        type: "call",
        payload: status,
        request: "set",
      });
    });

    this.callStore.on('speakingStateChanged', (status) => {
      DeskThing.send({
        type: "call",
        payload: status,
        request: "update",
      });
    });

    // Chat store events
    this.chatStore.on('update', (status) => {
      DeskThing.send({
        type: "chat",
        payload: status,
        request: "set",
      });
    });

    // Guild store events
    this.guildStore.on('guildUpdate', (status) => {
      DeskThing.send({
        type: "guildList",
        payload: status,
        request: "set",
      });
    });

    this.guildStore.on('channelsUpdated', (channels) => {
      DeskThing.send({
        type: "channels",
        payload: { channels },
        request: "set",
      });
    });

    // Notification store events
    this.notificationStore.on('statusUpdated', (status) => {
      DeskThing.send({
        type: "notification",
        payload: status,
        request: "set",
      });
    });

    this.notificationStore.on('notificationAdded', (notification) => {
      DeskThing.send({
        type: "notification",
        payload: { notification },
        request: "add",
      });
    });

    this.notificationStore.on('notificationRead', (notificationId) => {
      DeskThing.send({
        type: "notification",
        payload: { notificationId },
        request: "read",
      });
    });
  }
}
