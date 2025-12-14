import { DeskThing } from "@deskthing/server";
import { MessageObject, NotificationCreate, RPCEvents } from "../types/discordApiTypes";
import { getEncodedImage, getImageFromHash, ImageType } from "../utils/imageFetch";
import { Notification, NotificationStatus } from "../../../shared/types/discord";
import { DiscordRPCStore } from "./rpcStore";
import { GuildListManager } from "./guildStore";
import { EventEmitter } from "node:events"

interface notificationStatusEvents {
  notificationAdded: [Notification],
  notificationRead: [string],
  allNotificationsRead: [],
  statusCleared: [],
  statusUpdated: [NotificationStatus]
}

export class NotificationStatusManager extends EventEmitter<notificationStatusEvents> {
  private currentStatus: NotificationStatus = {
    notifications: [],
  };
  private debounceTimeoutId: NodeJS.Timeout | null = null;
  private rpc: DiscordRPCStore;
  private guildStore: GuildListManager;

  constructor(rpc: DiscordRPCStore, guildStore: GuildListManager) {
    super()
    this.rpc = rpc;
    this.guildStore = guildStore;
    this.setupEventListeners();
    this.subscribeToNotificationEvents();
  }

  private setupEventListeners(): void {
    this.rpc.on(
      RPCEvents.NOTIFICATION_CREATE,
      async (notif: NotificationCreate) => {
        await this.addNewNotification(notif);
      }
    );
  }

  private subscribeToNotificationEvents(): void {
    this.rpc
      .subscribe(RPCEvents.NOTIFICATION_CREATE)
      .catch((error) =>
        console.error(
          "Failed to subscribe to notification events:",
          error
        )
      );
  }

  public updateClient = () => {
    this.emit('statusUpdated', this.currentStatus);
  };

  private debounceUpdateClient = () => {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    } else {
      // If this is the first update, send it immediately
      console.log("Updating client with new notification status");
      this.updateClient();
    }

    this.debounceTimeoutId = setTimeout(() => {
      console.log("Updating client with new notification status");
      this.updateClient();
      this.debounceTimeoutId = null;
    }, 1000); // update with a second delay
  };

  public async addNewNotificationMessage(
    message: MessageObject,
    title: string = "",
    context?: { channelName?: string; guildName?: string }
  ) {
    console.log("Adding new notification message");
    
    let profileUrl: string | undefined;

    try {
      profileUrl = await getEncodedImage(
        message.author?.avatar,
        ImageType.UserAvatar,
        message.author.id
      );
    } catch (error) {
      console.error("Failed to fetch avatar image for notification", error);
      profileUrl = getImageFromHash(
        message.author.id,
        ImageType.DefaultUserAvatar,
        message.author.id
      );
    }

    const mediaUrls = this.collectMediaUrls(message);
    const resolvedContent = this.formatContentWithDisplayNames(message);
    const trimmed = resolvedContent.trim();
    const isSingleUrl =
      trimmed.startsWith("http") && trimmed.split(/\s+/).length === 1;
    const isPlaceholder = /^attachments?(?:\s*:\s*.*)?$/i.test(trimmed);
    const looksLikeAttachmentLine =
      mediaUrls.length > 0 && trimmed.toLowerCase().includes("attachment");
    const content =
      isPlaceholder ||
      looksLikeAttachmentLine ||
      (mediaUrls.length && (isSingleUrl || isPlaceholder))
        ? ""
        : resolvedContent;

    const newNotification: Notification = {
      id: message.id,
      title: title,
      channelId: message.channel_id,
      author: {
        id: message.author.id,
        username: message.author.username,
        profileUrl,
      },
      content,
      mediaUrls,
      timestamp: Date.parse(message.timestamp),
      read: false,
      channelName: context?.channelName,
      guildName: context?.guildName,
    };

    this.currentStatus.notifications.push(newNotification);
    // Keep only the last 50 notifications
    this.currentStatus.notifications =
      this.currentStatus.notifications.slice(-50);
    this.emit('notificationAdded', newNotification);
    this.debounceUpdateClient();
  }

  private getNotificationContext(channelId: string) {
    const { guilds, textChannels } = this.guildStore.getStatus();
    const channel = textChannels.find((c) => c.id === channelId);

    if (!channel) return { channelName: undefined, guildName: undefined };

    const guildName = channel.guild_id
      ? guilds.find((guild) => guild.id === channel.guild_id)?.name
      : undefined;

    return { channelName: channel.name, guildName };
  }

  private formatContentWithDisplayNames(message: MessageObject): string {
    const mentionMap = new Map<string, string>();
    // Mentions array
    (message.mentions ?? []).forEach((mention: any) => {
      const member: any = (mention as any)?.member ?? {};
      const memberUser: any = member.user ?? {};
      const display =
        member.nick ||
        member.display_name ||
        memberUser.global_name ||
        memberUser.username ||
        mention.global_name ||
        mention.username;
      if (display) mentionMap.set(mention.id, display);
    });
    // Resolved members/users
    const resolvedMembers: Record<string, any> = (message as any)?.resolved?.members ?? {};
    const resolvedUsers: Record<string, any> = (message as any)?.resolved?.users ?? {};
    Object.entries(resolvedMembers).forEach(([id, member]) => {
      const m: any = member;
      const u: any = m.user ?? resolvedUsers[id] ?? {};
      const display =
        m.nick ||
        m.display_name ||
        u.global_name ||
        u.username;
      if (display && !mentionMap.has(id)) mentionMap.set(id, display);
    });
    Object.entries(resolvedUsers).forEach(([id, user]) => {
      const u: any = user;
      const display = u.global_name || u.username;
      if (display && !mentionMap.has(id)) mentionMap.set(id, display);
    });

    return (message.content || "").replace(/<@([!&]?)(\d+)>/g, (match, prefix, userId) => {
      if (prefix === "&") return match; // keep role mentions untouched
      const displayName = mentionMap.get(userId);
      return displayName ? `@${displayName}` : match;
    });
  }

  private collectMediaUrls(message: MessageObject): string[] {
    const urls: string[] = [];
    const attachments = message.attachments ?? [];
    attachments.forEach((att) => {
      const isImage =
        (att.content_type?.startsWith("image/") ?? false) ||
        att.filename?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/);
      if (isImage && att.url) {
        urls.push(att.url);
      }
    });

    const embeds = message.embeds ?? [];
    embeds.forEach((embed) => {
      const url = embed.image?.url || embed.thumbnail?.url;
      if (url) urls.push(url);
    });

    const trimmed = (message.content || "").trim();
    const urlOnly =
      trimmed &&
      trimmed.split(/\s+/).length === 1 &&
      trimmed.match(
        /(https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(\?\S*)?$)|(https?:\/\/tenor\.com\/\S+)/i
      );
    if (urlOnly) {
      urls.push(trimmed);
    }

    return urls;
  }

  public async addNewNotification(notification: NotificationCreate) {
    // Check if we already have this notification to prevent duplicates
    if (this.currentStatus.notifications.some((n) => n.id === notification.message.id)) {
      return;
    }

    const context = this.getNotificationContext(notification.message.channel_id);

    try {
      await this.addNewNotificationMessage(notification.message, notification.title, context);
    } catch (error) {
      console.error(
        "Failed to add new notification, retrying with fallback avatar",
        error
      );
      await this.addNewNotificationMessage(
        {
          ...notification.message,
          author: { ...notification.message.author, avatar: undefined },
        },
        notification.title,
        context
      );
    }
  }

  public markNotificationAsRead(notificationId: string) {
    const notification = this.currentStatus.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
      this.emit('notificationRead', notificationId);
      this.debounceUpdateClient();
    }
  }

  public markAllNotificationsAsRead() {
    this.currentStatus.notifications.forEach((n) => (n.read = true));
    this.emit('allNotificationsRead');
    this.debounceUpdateClient();
  }

  public getStatus(): NotificationStatus {
    return { ...this.currentStatus };
  }

  public clearStatus() {
    this.currentStatus = {
      notifications: [],
    };
    this.emit('statusCleared');
    this.emit('statusUpdated', this.currentStatus);
  }
}
