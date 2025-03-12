import { DeskThing } from "@deskthing/server";
import { EventEmitter } from "events";
import { ServerEvent } from "@deskthing/types";
import { Channel, RPCCommands, RPCEvents } from "./types/discordApiTypes";
import { DiscordConfig } from "./types/discordTypes"
import { DiscordRPCStore } from "./stores/rpcStore"
import { DiscordAuth } from "./api/auth"
import { ChatStatusManager } from "./stores/chatStore"
import { RichPresence } from "./stores/presenceStore"

type discordServiceEvents = {
  ready: [];
};

export class DiscordService extends EventEmitter<discordServiceEvents> {
  private config: DiscordConfig = {
    clientId: "",
    clientSecret: "",
    richPresence: {
      enabled: false,
      mainText: "",
      secondaryText: "",
      showTimer: false,
    },
  };

  private rpc: DiscordRPCStore;
  private auth: DiscordAuth;
  private chatStatus: ChatStatusManager;
  private richPresence: RichPresence;

  constructor(rpc: DiscordRPCStore, auth: DiscordAuth, chatStatus: ChatStatusManager, richPresence: RichPresence) {
    super();
    this.rpc = rpc;
    this.auth = auth;
    this.chatStatus = chatStatus;
    this.richPresence = richPresence;
  }

  setRichPresenceConfig(config: {
    enabled: boolean;
    mainText?: string;
    secondaryText?: string;
    showTimer?: boolean;
  }): void {
    this.config.richPresence = {
      ...this.config.richPresence,
      ...config,
    };

    if (this.rpc.isConnected && config.enabled) {
      this.updateRichPresence();
    }
  }


  async updateRichPresence(): Promise<void> {
    if (!this.config.richPresence.enabled || !this.rpc.isConnected) {
      return;
    }

    try {
      await this.richPresence.setActivity({
        primary: this.config.richPresence.mainText,
        secondary: this.config.richPresence.secondaryText,
        timer: this.config.richPresence.showTimer,
      });
    } catch (error) {
      DeskThing.sendError(`Failed to update rich presence: ${error}`);
    }
  }

  isConnected(): boolean {
    return this.rpc.isConnected;
  }

}