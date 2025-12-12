import { DeskThing } from "@deskthing/server";
import {
  Channel,
  MessageObject,
  RPCCommands,
  RPCEvents,
} from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { ChatMessage, ChatStatus } from "../../../shared/types/discord";
import { EventEmitter } from "node:events";
import { DiscordRPCStore } from "./rpcStore";
import { GuildListManager } from "./guildStore";

const resolveDisplayName = (message: MessageObject) => {
  const author: any = message.author ?? {};
  const member: any = (message as any).member ?? {};
  const resolvedMember: any =
    (message as any)?.resolved?.members?.[author.id ?? ""] ?? {};

  return (
    member.nick ||
    member.display_name ||
    resolvedMember.nick ||
    resolvedMember.display_name ||
    resolvedMember.global_name ||
    author.global_name ||
    (author as any)?.display_name ||
    author.username ||
    author.id ||
    "Unknown"
  );
};

const mentionDisplayName = (userId: string, message: MessageObject) => {
  const resolvedMember: any =
    (message as any)?.resolved?.members?.[userId] ?? {};
  const resolvedUser: any = (message as any)?.resolved?.users?.[userId] ?? {};
  const mentionEntry = (message.mentions ?? []).find((m) => m.id === userId);
  const display =
    resolvedMember.nick ||
    resolvedMember.display_name ||
    mentionEntry?.global_name ||
    mentionEntry?.username ||
    resolvedUser?.global_name ||
    resolvedUser?.username;
  return display ? `@${display}` : `@${userId}`;
};

const replaceMentions = (content: string, message: MessageObject) => {
  if (!content) return "";
  return content.replace(/<@!?(\d+)>/g, (_, id) => mentionDisplayName(id, message));
};

type chatStatusEvents = {
  update: [ChatStatus];
};

export class ChatStatusManager extends EventEmitter<chatStatusEvents> {
  private currentStatus: ChatStatus = {
    isLoading: false,
    currentChannelId: null,
    messages: [],
    typingUsers: [],
  };
  private debounceTimeoutId: NodeJS.Timeout | null = null;
  private typingUserTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private rpc: DiscordRPCStore;
  private currentGuildId: string | null = null;
  private guildStore: GuildListManager;
  private log = (...args: any[]) => {
    if ((DeskThing as any)?.debug) {
      (DeskThing as any).debug(...args);
    } else {
      console.log(...args);
    }
  };
  private warn = (...args: any[]) => {
    if ((DeskThing as any)?.debug) {
      (DeskThing as any).debug(...args);
    } else {
      console.warn(...args);
    }
  };
  private error = (...args: any[]) => {
    if ((DeskThing as any)?.debug) {
      (DeskThing as any).debug(...args);
    } else {
      console.error(...args);
    }
  };

  constructor(rpc: DiscordRPCStore, guildStore: GuildListManager) {
    super();
    this.rpc = rpc;
    this.guildStore = guildStore;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.rpc.on(
      RPCEvents.MESSAGE_CREATE,
      async (data: { message: MessageObject; channel_id: string }) => {
        if (data.channel_id === this.currentStatus.currentChannelId) {
          await this.addNewMessage({
            ...data.message,
            channel_id: data.channel_id,
          });
        }
      }
    );

    this.guildStore.on("guildSelected", (guildId) => {
      if (guildId != this.currentGuildId) {
        this.currentGuildId = guildId;
        this.updateChannelId(null);
      }
    });
  }

  public updateChannelId(channelId: string | null) {
    if (!channelId || channelId != this.currentStatus.currentChannelId) {
      this.currentStatus.messages = [];
      this.currentStatus.typingUsers = [];
      this.currentStatus.isLoading = true;
    }
    this.currentStatus.currentChannelId = channelId;

    this.log(`Chat channel ID updated: ${channelId || "None"}`);
    this.debounceUpdateClient();
  }

  public setChatExpand(isExpanded: boolean) {
    this.currentStatus.isLoading = isExpanded;
    this.log(`Chat expand status: ${isExpanded}`);
    this.debounceUpdateClient();
  }

  public updateClient = () => {
    this.emit("update", this.currentStatus);
  };

  private debounceUpdateClient = () => {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    } else {
      this.log("Updating client with new chat status");
      this.updateClient();
    }

    this.debounceTimeoutId = setTimeout(() => {
      this.log("Updating client with new chat status");
      this.updateClient();
      this.debounceTimeoutId = null;
    }, 1000);
  };

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
      const imageUrl = embed.image?.url || embed.thumbnail?.url;
      if (imageUrl) {
        urls.push(imageUrl);
      }
    });

    // If content is a single image/gif URL, treat it as media and drop from text.
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

  public async addNewMessage(message: MessageObject) {
    if (this.currentStatus.messages.some((m) => m.id === message.id)) {
      return;
    }
    const mediaUrls = this.collectMediaUrls(message);
    const replacedContent = replaceMentions(message.content || "", message);
    const trimmed = replacedContent.trim();
    const isSingleUrl =
      trimmed.startsWith("http") && trimmed.split(/\s+/).length === 1;
    const isPlaceholder = /^attachments?$/i.test(trimmed);
    const content =
      mediaUrls.length && (isSingleUrl || isPlaceholder) ? "" : replacedContent;

    const chatMessage: ChatMessage = {
      id: message.id,
      content,
      mediaUrls,
      author: {
        id: message.author?.id || "unknown",
        displayName: resolveDisplayName(message),
        username: message.author?.username || "Unknown User",
        profileUrl: await getEncodedImage(
          message.author?.avatar,
          ImageType.UserAvatar,
          message.author.id
        ),
      },
      timestamp: Date.parse(message.timestamp),
    };

    this.currentStatus.messages.push(chatMessage);
    this.currentStatus.messages = this.currentStatus.messages.slice(-50);
    this.debounceUpdateClient();
  }

  public addTypingUser(userId: string) {
    if (!this.currentStatus.typingUsers.includes(userId)) {
      this.currentStatus.typingUsers.push(userId);
      this.debounceUpdateClient();
    }

    if (this.typingUserTimeouts.has(userId)) {
      clearTimeout(this.typingUserTimeouts.get(userId));
    }

    const timeoutId = setTimeout(() => {
      this.removeTypingUser(userId);
    }, 5000);
    this.typingUserTimeouts.set(userId, timeoutId);
  }

  public setupNewChannel = async (channel: Channel) => {
    this.updateChannelId(channel.id);
    channel?.messages?.forEach(async (message) => {
      await this.addNewMessage(message);
    });

    this.log(`Added ${channel.messages?.length || 0} messages`);

    this.currentStatus.isLoading = false;
    this.log(
      `Setting up new channel: ${channel.id} (${channel.name}) Guild is ${
        channel.guild_id || "DM"
      }`
    );
    this.currentGuildId = channel.guild_id ?? null;

    try {
      await this.rpc.subscribe(RPCEvents.MESSAGE_CREATE, channel.id);
    } catch (error) {
      this.error(
        `Failed to subscribe to messages for channel ${channel.id}:`,
        error
      );

      // Try to resubscribe after a delay
      setTimeout(async () => {
        try {
          this.log(
            `Retrying subscription to MESSAGE_CREATE for channel ${channel.id}`
          );
          await this.rpc.subscribe(RPCEvents.MESSAGE_CREATE, channel.id);
          this.log(
            `Successfully subscribed to MESSAGE_CREATE for channel ${channel.id} on retry`
          );
        } catch (retryError) {
          this.error(
            `Failed to subscribe to MESSAGE_CREATE for channel ${channel.id} on retry: ${retryError}`
          );
        }
      }, 2000);
    }
    // await this.rpc.subscribe(RPCEvents.TYPING_START, channel.id);
    // await this.rpc.subscribe(RPCEvents.TYPING_STOP, channel.id);
  };

  async selectTextChannel(channelId: string | undefined | null) {
    if (channelId) {
      const channel = (await this.rpc.request(RPCCommands.GET_CHANNEL, {
        channel_id: channelId,
      })) as Channel;
      if (channel) {
        this.setupNewChannel(channel);
      }
    } else {
      this.updateChannelId(null);
    }
  }

  public removeTypingUser(userId: string) {
    this.currentStatus.typingUsers = this.currentStatus.typingUsers.filter(
      (id) => id !== userId
    );
    this.debounceUpdateClient();

    if (this.typingUserTimeouts.has(userId)) {
      clearTimeout(this.typingUserTimeouts.get(userId));
      this.typingUserTimeouts.delete(userId);
    }
  }

  public getStatus(): ChatStatus {
    return { ...this.currentStatus };
  }

  public clearStatus() {
    if (this.currentStatus.currentChannelId) {
      this.rpc.unsubscribe(RPCEvents.MESSAGE_CREATE);
      // this.rpc.unsubscribe(RPCEvents.TYPING_START);
      // this.rpc.unsubscribe(RPCEvents.TYPING_STOP);
    }

    this.currentStatus = {
      isLoading: true,
      currentChannelId: null,
      messages: [],
      typingUsers: [],
    };
  }
}
