import { DeskThing } from "@deskthing/server";
import { Channel, MessageObject } from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { ChatMessage, ChatStatus } from "@shared/types/discord";

export class ChatStatusManager {
  private currentStatus: ChatStatus = {
    isExpanded: false,
    currentChannelId: null,
    messages: [],
    typingUsers: [],
  };
  private debounceTimeoutId: NodeJS.Timeout | null = null;
  private typingUserTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {}

  public updateChannelId(channelId: string | null) {
    this.currentStatus.currentChannelId = channelId;
    if (!channelId) {
      this.currentStatus.messages = [];
      this.currentStatus.typingUsers = [];
    }
    // TODO: Add Deskthing.send for updating the channel id in @server\discord\index.ts similar to callStatus
    DeskThing.sendLog(`Chat channel ID updated: ${channelId || "None"}`);
    this.debounceUpdateClient();
  }

  public setChatExpand(isExpanded: boolean) {
    this.currentStatus.isExpanded = isExpanded;
    DeskThing.sendLog(`Chat expand status: ${isExpanded}`);
    this.debounceUpdateClient();
  }

  public updateClient = () => {
    DeskThing.send({
      type: "chat",
      payload: this.currentStatus,
      request: "set",
    });
  };

  private debounceUpdateClient = () => {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    } else {
      // If this is the first update, send it immediately
      DeskThing.sendLog("Updating client with new chat status");
      this.updateClient();
    }

    this.debounceTimeoutId = setTimeout(() => {
      DeskThing.sendLog("Updating client with new chat status");
      this.updateClient();
      this.debounceTimeoutId = null;
    }, 1000); // update with a second delay
  };

  public async addNewMessage(message: MessageObject) {
    // Check if we already have this message to prevent duplicates
    if (this.currentStatus.messages.some((m) => m.id === message.id)) {
      return;
    }
    console.log(message)
    const chatMessage: ChatMessage = {
      id: message.id,
      content: message.content || 'No text content',
      author: {
        id: message.author?.id || 'unknown',
        username: message.author?.username || 'Unknown User',
        profileUrl: await getEncodedImage(
          message.author?.avatar,
          ImageType.UserAvatar,
          message.author.id
        ),
      },
      timestamp: Date.parse(message.timestamp),
    };

    this.currentStatus.messages.push(chatMessage);
    // Keep only the last 50 messages
    this.currentStatus.messages = this.currentStatus.messages.slice(-50);
    this.debounceUpdateClient();
  }

  public addTypingUser(userId: string) {
    if (!this.currentStatus.typingUsers.includes(userId)) {
      this.currentStatus.typingUsers.push(userId);
      this.debounceUpdateClient();
    }

    // Clear any existing timeout for this user
    if (this.typingUserTimeouts.has(userId)) {
      clearTimeout(this.typingUserTimeouts.get(userId));
    }

    // Set a timeout to remove the user after 5 seconds of inactivity
    const timeoutId = setTimeout(() => {
      this.removeTypingUser(userId);
    }, 5000);
    this.typingUserTimeouts.set(userId, timeoutId);
  }

  public setupNewChannel = async (channel: Channel) => {
    this.updateChannelId(channel.id);
    channel?.messages?.forEach(async (message) => {
      DeskThing.sendLog('Adding new message' + message.content)
      await this.addNewMessage(message);
    });
  }

  public removeTypingUser(userId: string) {
    this.currentStatus.typingUsers = this.currentStatus.typingUsers.filter(
      (id) => id !== userId
    );
    this.debounceUpdateClient();

    // Clear the timeout for this user if it exists
    if (this.typingUserTimeouts.has(userId)) {
      clearTimeout(this.typingUserTimeouts.get(userId));
      this.typingUserTimeouts.delete(userId);
    }
  }

  public getStatus(): ChatStatus {
    return { ...this.currentStatus };
  }

  public clearStatus() {
    this.currentStatus = {
      isExpanded: false,
      currentChannelId: null,
      messages: [],
      typingUsers: [],
    };
  }
}
