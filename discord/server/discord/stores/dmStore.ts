  import { DeskThing } from "@deskthing/server";
  import {
    Channel,
    GetChannelsData,
    RPCCommands,
    RPCEvents,
  } from "../types/discordApiTypes";
  import { getEncodedImageURL } from "../utils/imageFetch";
  import { ChannelTypes } from "discord-interactions";
  import { EventEmitter } from "node:events";
  import { DiscordRPCStore } from "./rpcStore";
  import {
    ChannelStatus,
    DMListStatus,
    DMStatus,
  } from "../../../shared/types/discord";

  interface dmListEvents {
    dmUpdate: [DMListStatus];
    dmSelected: [string | null];
    channelsUpdated: [ChannelStatus[]];
    statusCleared: [];
  }

  export class DMListManager extends EventEmitter<dmListEvents> {
    private currentStatus: DMListStatus = {
      selectedDMId: null,
      dms: [],
      channels: [],
    };
    private rpc: DiscordRPCStore;
    private avatarCache: Map<string, string> = new Map();

    constructor(rpc: DiscordRPCStore) {
      super();
      this.rpc = rpc;
      this.setupEventListeners();
    }

    private setupEventListeners(): void {
      this.rpc.on(RPCEvents.CHANNEL_CREATE, async (channel: Channel) => {
        await this.handleChannelCreate(channel);
      });
    }

    private async handleChannelCreate(channel: Channel): Promise<void> {
      if (channel.id !== this.currentStatus.selectedDMId) return;

      if (channel.type === ChannelTypes.DM || channel.type === ChannelTypes.GROUP_DM) {
        const channelStatus = await this.constructChannel(channel);

        const existingChannelIndex = this.currentStatus.channels.findIndex(
          (c) => c.id === channel.id
        );
        if (existingChannelIndex !== -1) {
          this.currentStatus.channels[existingChannelIndex] = channelStatus;
        } else {
          this.currentStatus.channels.push(channelStatus);
        }

        this.emit("channelsUpdated", [...this.currentStatus.channels]);
      }
    }

    public async refreshDMList(): Promise<void> {
      console.debug("Refreshing DM list");
      const channels = (await this.rpc.request(
        RPCCommands.GET_CHANNELS,
        {}
      )) as GetChannelsData;
      console.debug("Got channels");

      if (!channels.channels) {
        console.warn("No channels found");
        return;
      }

      const dms = channels.channels.filter(
        channel => channel.type === ChannelTypes.DM || channel.type === ChannelTypes.GROUP_DM
      );

      await this.updateDMList(dms);
    }

    private async constructDM(channel: Channel): Promise<DMStatus> {
      let avatar = this.avatarCache.get(channel.id);
    
      if (!avatar) {
        try {
          // You'll need to implement logic to get avatar URL from the channel data
          const avatarUrl = ""; // TODO: Get proper avatar URL
          if (avatarUrl) {
            avatar = await getEncodedImageURL(avatarUrl);
            if (avatar) {
              this.avatarCache.set(channel.id, avatar);
            } else {
              console.debug('Failed to fetch DM avatar')
              console.log(channel)
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch DM avatar for ${channel.id}: ${error}`
          );
          avatar = "";
        }
      }

      return {
        id: channel.id,
        name: channel.name,
        avatar: avatar || "",
      };
    }

    private async constructChannel(channel: Channel): Promise<ChannelStatus> {
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        guild_id: channel.guild_id
      };
    }

    public async updateSelectedDM(dmId: string | null): Promise<void> {
      if (this.currentStatus.selectedDMId) {
        this.rpc.unsubscribe(RPCEvents.CHANNEL_CREATE);
      }

      this.currentStatus.selectedDMId = dmId;

      if (!dmId) {
        console.debug('Clearing channels (empty DM id)')
        this.currentStatus.channels = [];
      } else {
        this.rpc.subscribe(RPCEvents.CHANNEL_CREATE, dmId);
        const channelResponse = await this.rpc.request(RPCCommands.GET_CHANNELS, {
          guild_id: dmId,
        }) as GetChannelsData;
        this.setupDMChannels(channelResponse.channels);
      }

      console.log(`Selected DM ID updated: ${dmId || "None"}`);
      this.emit("dmSelected", dmId);
    }

    public async updateDMList(channels: Channel[]) {
      const processedDMs = await Promise.all(
        channels.map((channel) => this.constructDM(channel))
      );

      this.currentStatus.dms = processedDMs;
      console.log(`DM list updated with ${processedDMs.length} DMs`);
      this.emit("dmUpdate", this.currentStatus);
    }

    public async updateChannels(channels: Channel[]) {
      const dmChannels = channels?.filter(
        (channel) =>
          channel.type === ChannelTypes.DM ||
          channel.type === ChannelTypes.GROUP_DM
      ) || [];

      this.currentStatus.channels = await Promise.all(
        dmChannels.map((channel) => this.constructChannel(channel))
      );

      console.log(
        `DM channels updated with ${dmChannels.length} channels`
      );
      this.emit("channelsUpdated", [...this.currentStatus.channels]);
    }

    public setupDM = async (channel: Channel): Promise<void> => {
      this.updateSelectedDM(channel.id);
    };

    public setupDMChannels = async (channels: Channel[]): Promise<void> => {
      const dmChannels = channels?.filter(
        (channel) =>
          channel.type === ChannelTypes.DM ||
          channel.type === ChannelTypes.GROUP_DM
      ) || [];

      await this.updateChannels(dmChannels);
    };

    public getStatus(): DMListStatus {
      return { ...this.currentStatus };
    }

    public clearStatus() {
      if (this.currentStatus.selectedDMId) {
        this.rpc.unsubscribe(RPCEvents.CHANNEL_CREATE);
      }

      this.avatarCache.clear();

      this.currentStatus = {
        selectedDMId: null,
        dms: [],
        channels: [],
      };

      this.emit("statusCleared");
    }

    public validateState(): void {
      const dmIds = new Set(this.currentStatus.dms.map((d) => d.id));

      if (
        this.currentStatus.selectedDMId &&
        !dmIds.has(this.currentStatus.selectedDMId)
      ) {
        this.updateSelectedDM(null);
      }

      this.currentStatus.channels = this.currentStatus.channels.filter(
        (channel) => channel.id === this.currentStatus.selectedDMId
      );
    }
  }
