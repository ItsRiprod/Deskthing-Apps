import { DeskThing } from "@deskthing/server";
import {
  Channel,
  GetChannelsData,
  GetGuildData,
  GetGuildsData,
  Guild,
  RPCCommands,
  RPCEvents,
} from "../types/discordApiTypes";
import { getEncodedImage, getEncodedImageURL, ImageType } from "../utils/imageFetch";
import { ChannelTypes } from "discord-interactions";
import { EventEmitter } from "node:events";
import { DiscordRPCStore } from "./rpcStore";
import {
  ChannelStatus,
  GuildListStatus,
  GuildStatus,
} from "../../../shared/types/discord";

interface guildListEvents {
  guildUpdate: [GuildListStatus];
  guildSelected: [string | null];
  channelsUpdated: [ChannelStatus[]];
  statusCleared: [];
}

export class GuildListManager extends EventEmitter<guildListEvents> {
  private currentStatus: GuildListStatus = {
    selectedGuildId: null,
    guilds: [],
    textChannels: [],
  };
  private rpc: DiscordRPCStore;
  private iconCache: Map<string, string> = new Map();

  constructor(rpc: DiscordRPCStore) {
    super();
    this.rpc = rpc;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Guild events
    this.rpc.on(RPCEvents.GUILD_CREATE, async (createdGuild) => {
      const guild: GetGuildData = {
        id: createdGuild.id,
        name: createdGuild.name,
        icon_url: createdGuild.icon || null,
      };

      await this.handleGuildCreate(guild);
    });

    // Channel events
    this.rpc.on(RPCEvents.CHANNEL_CREATE, async (channel: Channel) => {
      await this.handleChannelCreate(channel);
    });
  }

  private async handleGuildCreate(guild: GetGuildData): Promise<void> {
    const existingGuildIndex = this.currentStatus.guilds.findIndex(
      (g) => g.id === guild.id
    );
    const newGuild = await this.constructGuild(guild);

    if (existingGuildIndex !== -1) {
      this.currentStatus.guilds[existingGuildIndex] = newGuild;
    } else {
      this.currentStatus.guilds.push(newGuild);
    }

    this.emit("guildUpdate", this.getStatus());
  }

  private async handleGuildUpdate(guild: GetGuildData): Promise<void> {
    // Invalidate the icon cache if the icon has changed
    const existingGuild = this.currentStatus.guilds.find(
      (g) => g.id === guild.id
    );
    if (
      existingGuild &&
      existingGuild.icon &&
      guild.icon_url &&
      existingGuild.icon !== guild.icon_url
    ) {
      this.iconCache.delete(guild.id);
    }

    await this.handleGuildCreate(guild); // Reuse existing logic
  }

  private async handleChannelCreate(channel: Channel): Promise<void> {
    if (channel.guild_id !== this.currentStatus.selectedGuildId) return;

    if (
      channel.type === ChannelTypes.GUILD_TEXT ||
      channel.type === ChannelTypes.GUILD_VOICE
    ) {
      const channelStatus = await this.constructChannel(channel);

      // Check if channel already exists
      const existingChannelIndex = this.currentStatus.textChannels.findIndex(
        (c) => c.id === channel.id
      );
      if (existingChannelIndex !== -1) {
        this.currentStatus.textChannels[existingChannelIndex] = channelStatus;
      } else {
        this.currentStatus.textChannels.push(channelStatus);
      }

      this.emit("channelsUpdated", [...this.currentStatus.textChannels]);
    }
  }

  public async refreshGuildList(): Promise<void> {
    DeskThing.sendDebug("Refreshing guild list");
    const guild = (await this.rpc.request(
      RPCCommands.GET_GUILDS,
      {}
    )) as GetGuildsData;
    DeskThing.sendDebug("Got guilds");

    if (!guild.guilds) {
      DeskThing.sendWarning("No guilds found");
      return;
    }

    this.updateGuildList(guild.guilds);
  }

  private async constructGuild(guild: GetGuildData): Promise<GuildStatus> {
    // Use cached icon if available and icon hasn't changed
    let icon = this.iconCache.get(guild.id);
    
    if (!icon && guild.icon_url) {
      try {
        icon = await getEncodedImageURL(guild.icon_url);
        if (icon) {
          this.iconCache.set(guild.id, icon);
        } else {
          DeskThing.sendDebug('Failed to fetch guild icon')
          console.log(guild)
        }
      } catch (error) {
        DeskThing.sendError(
          `Failed to fetch guild icon for ${guild.id}: ${error}`
        );
        icon = ""; // Use empty string as fallback
      }
    }

    return {
      id: guild.id,
      name: guild.name,
      icon: icon || "",
    };
  }

  private async constructChannel(channel: Channel): Promise<ChannelStatus> {
    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      guild_id: channel.guild_id,
    };
  }

  public async updateSelectedGuild(guildId: string | null): Promise<void> {
    // If we had a previously selected guild, unsubscribe from its events
    if (this.currentStatus.selectedGuildId) {
      this.rpc.unsubscribe(RPCEvents.CHANNEL_CREATE);
    }

    this.currentStatus.selectedGuildId = guildId;

    // Clear text channels if no guild is selected
    if (!guildId) {
      DeskThing.sendDebug('Clearing text channels (empty guild id)')
      this.currentStatus.textChannels = [];
    } else {
      // Subscribe to events for the new guild
      this.rpc.subscribe(RPCEvents.CHANNEL_CREATE, guildId);
      const channelResponse = await this.rpc.request(RPCCommands.GET_CHANNELS, {
        guild_id: guildId,
      }) as GetChannelsData
      this.setupGuildChannels(channelResponse.channels);
    }

    DeskThing.sendLog(`Selected guild ID updated: ${guildId || "None"}`);
    this.emit("guildSelected", guildId);
  }

  public async updateGuildList(guilds: GetGuildData[]) {
    // Process guilds in batches to avoid blocking the main thread
    const processedGuilds = await Promise.all(
      guilds.map((guild) => this.constructGuild(guild))
    );

    this.currentStatus.guilds = processedGuilds;
    DeskThing.sendLog(`Guild list updated with ${processedGuilds.length} guilds`);
    this.emit("guildUpdate", this.currentStatus);
  }

  public async updateTextChannels(channels: Channel[]) {
    const textChannels =
      channels?.filter(
        (channel) =>
          channel.type === ChannelTypes.GUILD_TEXT ||
          channel.type === ChannelTypes.GUILD_VOICE
      ) || [];

    // Convert to ChannelStatus objects before emitting
    this.currentStatus.textChannels = await Promise.all(
      textChannels.map((channel) => this.constructChannel(channel))
    );

    DeskThing.sendLog(
      `Text channels updated with ${textChannels.length} channels`
    );
    this.emit("channelsUpdated", [...this.currentStatus.textChannels]);
  }

  public setupGuild = async (guild: Guild): Promise<void> => {
    this.updateSelectedGuild(guild.id);
  };

  public setupGuildChannels = async (channels: Channel[]): Promise<void> => {
    const textChannels =
      channels?.filter(
        (channel) =>
          channel.type === ChannelTypes.GUILD_TEXT ||
          channel.type === ChannelTypes.GUILD_VOICE
      ) || [];

    await this.updateTextChannels(textChannels);
  };

  public getStatus(): GuildListStatus {
    return { ...this.currentStatus };
  }

  public clearStatus() {
    // Unsubscribe from all events for the current guild
    if (this.currentStatus.selectedGuildId) {
      this.rpc.unsubscribe(RPCEvents.CHANNEL_CREATE);
    }

    // Clear the icon cache to free memory
    this.iconCache.clear();

    this.currentStatus = {
      selectedGuildId: null,
      guilds: [],
      textChannels: [],
    };

    this.emit("statusCleared");
  }

  // Validates and repairs any inconsistencies in the current state
  public validateState(): void {
    // Ensure all channels belong to existing guilds
    const guildIds = new Set(this.currentStatus.guilds.map((g) => g.id));

    // If the selected guild doesn't exist in our list, clear it
    if (
      this.currentStatus.selectedGuildId &&
      !guildIds.has(this.currentStatus.selectedGuildId)
    ) {
      this.updateSelectedGuild(null);
    }

    // Filter out channels for guilds that no longer exist
    this.currentStatus.textChannels = this.currentStatus.textChannels.filter(
      (channel) => {
        return channel.guild_id === this.currentStatus.selectedGuildId;
      }
    );
  }
}
