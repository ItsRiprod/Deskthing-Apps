import { DeskThing } from "@deskthing/server";
import { Channel, MessageObject, RPCCommands, RPCEvents } from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { ChatMessage, ChatStatus } from "@shared/types/discord";
import { EventEmitter } from "node:events";
import { DiscordRPCStore } from "./rpcStore";

type chatStatusEvents = {
  update: [ChatStatus];
};

export class ChatStatusManager extends EventEmitter<chatStatusEvents> {
  private currentStatus: ChatStatus = {
    isExpanded: false,
    currentChannelId: null,
    messages: [],
    typingUsers: [],
  };
  private debounceTimeoutId: NodeJS.Timeout | null = null;
  private typingUserTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private rpc: DiscordRPCStore;

  constructor(rpc: DiscordRPCStore) {
    super();
    this.rpc = rpc;
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
  }

  public updateChannelId(channelId: string | null) {
    this.currentStatus.currentChannelId = channelId;
    if (!channelId) {
      this.currentStatus.messages = [];
      this.currentStatus.typingUsers = [];
    }
    DeskThing.sendLog(`Chat channel ID updated: ${channelId || "None"}`);
    this.debounceUpdateClient();
  }

  public setChatExpand(isExpanded: boolean) {
    this.currentStatus.isExpanded = isExpanded;
    DeskThing.sendLog(`Chat expand status: ${isExpanded}`);
    this.debounceUpdateClient();
  }

  public updateClient = () => {
    this.emit("update", this.currentStatus);
  };

  private debounceUpdateClient = () => {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    } else {
      DeskThing.sendLog("Updating client with new chat status");
      this.updateClient();
    }

    this.debounceTimeoutId = setTimeout(() => {
      DeskThing.sendLog("Updating client with new chat status");
      this.updateClient();
      this.debounceTimeoutId = null;
    }, 1000);
  };

  public async addNewMessage(message: MessageObject) {
    if (this.currentStatus.messages.some((m) => m.id === message.id)) {
      return;
    }
    console.log(message);
    const chatMessage: ChatMessage = {
      id: message.id,
      content: message.content || "No text content",
      author: {
        id: message.author?.id || "unknown",
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
      DeskThing.sendLog("Adding new message" + message.content);
      await this.addNewMessage(message);
    });

    await this.rpc.subscribe(RPCEvents.MESSAGE_CREATE, channel.id);
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
      isExpanded: false,
      currentChannelId: null,
      messages: [],
      typingUsers: [],
    };
  }
}
