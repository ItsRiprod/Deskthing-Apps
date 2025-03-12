import { DeskThing } from "@deskthing/server";
import { Channel, Guild, RPCEvents } from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { ChannelTypes } from "discord-interactions"
import { EventEmitter } from "node:events"
import { DiscordRPCStore } from "./rpcStore";

interface guildListEvents {
  guildUpdate: [GuildListStatus];
  guildSelected: [string | null];
  channelsUpdated: [Channel[]];
  statusCleared: [];
}

export interface GuildListStatus {
  selectedGuildId: string | null;
  guilds: Guild[];
  textChannels: Channel[];
}

export class GuildListManager extends EventEmitter<guildListEvents> {
  private currentStatus: GuildListStatus = {
    selectedGuildId: null,
    guilds: [],
    textChannels: [],
  };
  private rpc: DiscordRPCStore;

  constructor(rpc: DiscordRPCStore) {
    super()
    this.rpc = rpc;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.rpc.on(RPCEvents.GUILD_CREATE, async (guild) => {
      const existingGuildIndex = this.currentStatus.guilds.findIndex(g => g.id === guild.id);
      if (existingGuildIndex !== -1) {
        this.currentStatus.guilds[existingGuildIndex] = guild;
      } else {
        this.currentStatus.guilds.push(guild);
      }
      this.emit('guildUpdate', this.getStatus());
    });

    this.rpc.on(RPCEvents.CHANNEL_CREATE, async (channel: Channel) => {
      if (channel.guild_id === this.currentStatus.selectedGuildId &&
          (channel.type === ChannelTypes.GUILD_TEXT || channel.type === ChannelTypes.GUILD_VOICE)) {
        this.currentStatus.textChannels.push(channel);
        this.emit('channelsUpdated', [...this.currentStatus.textChannels]);
      }
    });
  }

  public updateSelectedGuild(guildId: string | null) {
    this.currentStatus.selectedGuildId = guildId;
    if (!guildId) {
      this.currentStatus.textChannels = [];
    }
    DeskThing.sendLog(`Selected guild ID updated: ${guildId || "None"}`);
    this.emit('guildSelected', guildId);
  }

  public updateGuildList(guilds: Guild[]) {
    this.currentStatus.guilds = guilds;
    DeskThing.sendLog(`Guild list updated with ${guilds.length} guilds`);
    this.emit('guildUpdate', this.getStatus());
  }

  public updateTextChannels(channels: Channel[]) {
    this.currentStatus.textChannels = channels;
    DeskThing.sendLog(`Text channels updated with ${channels.length} channels`);
    this.emit('channelsUpdated', [...channels]);
  }

  public setupGuild = async (guild: Guild): Promise<void> => {
    this.updateSelectedGuild(guild.id);
    await this.rpc.subscribe(RPCEvents.CHANNEL_CREATE, guild.id);
  }

  public setupGuildChannels = async (channels: Channel[]): Promise<void> => {
    const textChannels = channels?.filter(channel => 
      channel.type === ChannelTypes.GUILD_TEXT || channel.type === ChannelTypes.GUILD_VOICE
    ) || [];
    this.updateTextChannels(textChannels);
  }

  public getStatus(): GuildListStatus {
    return { ...this.currentStatus };
  }

  public clearStatus() {
    if (this.currentStatus.selectedGuildId) {
      this.rpc.unsubscribe(RPCEvents.CHANNEL_CREATE);
    }

    this.currentStatus = {
      selectedGuildId: null,
      guilds: [],
      textChannels: [],
    };
    this.emit('statusCleared');
  }
}