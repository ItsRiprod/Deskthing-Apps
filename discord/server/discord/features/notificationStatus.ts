import { DeskThing } from "@deskthing/server";
import { MessageObject, NotificationCreate } from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { Notification, NotificationStatus } from "@shared/types/discord";

export class NotificationStatusManager {
  private currentStatus: NotificationStatus = {
    notifications: [],
  };
  private debounceTimeoutId: NodeJS.Timeout | null = null;

  constructor() {}

  public updateClient = () => {
    DeskThing.send({
      type: "notification",
      payload: this.currentStatus,
      request: "set",
    });
  };

  private debounceUpdateClient = () => {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    } else {
      // If this is the first update, send it immediately
      DeskThing.sendLog("Updating client with new notification status");
      this.updateClient();
    }

    this.debounceTimeoutId = setTimeout(() => {
      DeskThing.sendLog("Updating client with new notification status");
      this.updateClient();
      this.debounceTimeoutId = null;
    }, 1000); // update with a second delay
  };

  public async addNewNotificationMessage(message: MessageObject, title: string = "") {
    DeskThing.sendLog("Adding new notification message");
    
    const newNotification: Notification = {
      id: message.id,
      title: title,
      channelId: message.channel_id,
      author: {
        id: message.author.id,
        username: message.author.username,
        profileUrl: await getEncodedImage(
          message.author?.avatar,
          ImageType.UserAvatar,
          message.author.id
        ),
      },
      content: message.content,
      timestamp: Date.parse(message.timestamp),
      read: false,
    };

    this.currentStatus.notifications.push(newNotification);
    // Keep only the last 50 notifications
    this.currentStatus.notifications =
      this.currentStatus.notifications.slice(-50);
    this.debounceUpdateClient();
  }

  public async addNewNotification(notification: NotificationCreate) {
    // Check if we already have this notification to prevent duplicates
    if (this.currentStatus.notifications.some((n) => n.id === notification.message.id)) {
      return;
    }

    this.addNewNotificationMessage(notification.message, notification.title);
  }

  public markNotificationAsRead(notificationId: string) {
    const notification = this.currentStatus.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
      this.debounceUpdateClient();
    }
  }

  public markAllNotificationsAsRead() {
    this.currentStatus.notifications.forEach((n) => (n.read = true));
    this.debounceUpdateClient();
  }

  public getStatus(): NotificationStatus {
    return { ...this.currentStatus };
  }

  public clearStatus() {
    this.currentStatus = {
      notifications: [],
    };
  }
}
