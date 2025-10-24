import {
  Channel,
  RPCCommands,
  RPCEvents,
  VoiceStateCreate,
} from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { CallStatus, CallParticipant } from "../../../shared/types/discord";
import { DiscordRPCStore } from "./rpcStore";
import { EventEmitter } from "node:events";

type callStatusEvents = {
  update: [CallStatus];
  participantJoined: [CallParticipant];
  participantLeft: [{ userId: string }];
  participantUpdated: [CallParticipant];
  speakingStateChanged: [{ userId: string; isSpeaking: boolean }];
  channelChanged: [Channel | undefined];
  connectionStateChanged: [boolean];
};

export class CallStatusManager extends EventEmitter<callStatusEvents> {
  private currentStatus: CallStatus = {
    channelId: null,
    participants: [],
    isConnected: false,
    timestamp: Date.now(),
    channel: undefined,
    user: undefined,
  };
  private activeSubscriptions = false
  private rpc: DiscordRPCStore;

  constructor(rpc: DiscordRPCStore) {
    super();
    this.rpc = rpc;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.rpc.on(
      RPCEvents.VOICE_STATE_CREATE,
      async (data: VoiceStateCreate) => {
        console.debug(`Voice state created for user ${data.user.id}`);
        const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username,
          isMuted:
            data.mute || data.voice_state.mute || data.voice_state.self_mute,
          isDeafened: data.voice_state.deaf || data.voice_state.self_deaf,
          isSpeaking: false,
        };
        this.updateParticipant(participant);
        this.emit("participantJoined", participant);
      }
    );

    this.rpc.on(RPCEvents.READY, async (data) => {
      if (!data.user) return

      const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username || data.user.id,
          isDeafened: this.currentStatus.user?.isDeafened || false,
          isMuted: this.currentStatus.user?.isMuted || false,
          isSpeaking: false,
        }
      this.updateCurrentUser(participant)
    })

    this.rpc.on(
      RPCEvents.VOICE_STATE_UPDATE,
      async (data: VoiceStateCreate) => {
        console.debug(`Voice state updated for user ${data.user.id}`);
        const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username,
          isMuted:
            data.mute || data.voice_state.mute || data.voice_state.self_mute,
          isDeafened: data.voice_state.deaf || data.voice_state.self_deaf,
          isSpeaking: false,
        };
        this.updateParticipant(participant);
        this.emit("participantUpdated", participant);
      }
    );

    this.rpc.on(RPCEvents.VOICE_STATE_DELETE, (data: VoiceStateCreate) => {
      this.removeParticipant(data.user.id);
      this.emit("participantLeft", { userId: data.user.id });
    });

    this.rpc.on(RPCEvents.SPEAKING_START, (data: { user_id: string }) => {
      console.log(`User ${data.user_id} started speaking`);
      this.updateSpeakingStatus(data.user_id, true);
    });

    this.rpc.on(RPCEvents.SPEAKING_STOP, (data: { user_id: string }) => {
      console.log(`User ${data.user_id} stopped speaking`);
      this.updateSpeakingStatus(data.user_id, false);
    });

    this.rpc.on(RPCEvents.VOICE_CONNECTION_STATUS, async (data) => {
      const isConnected = data.state === "VOICE_CONNECTED";
      this.setConnectionStatus(isConnected);
      this.updateCurrentUser(this.rpc.user || undefined);
    });

    this.rpc.subscribe(RPCEvents.VOICE_CONNECTION_STATUS);
  }

  public updateChannelId(channelId: string | null) {
    this.currentStatus.channelId = channelId;
    this.currentStatus.timestamp = Date.now();
    if (!channelId) {
      this.currentStatus.participants = [];
      this.currentStatus.isConnected = false;
      this.currentStatus.channel = undefined;
      this.emit("channelChanged", undefined);
    }

    console.log(`Call channel ID updated: ${channelId || "None"}`);
  }

  public async updateParticipant(participant: CallParticipant): Promise<void> {
    if (participant.id == this.currentStatus?.user?.id) {
      this.updateCurrentUser(participant);
    }
    const index = this.currentStatus.participants.findIndex(
      (p) => p.id === participant.id
    );
    if (index !== -1) {
      this.currentStatus.participants[index] = participant;
    } else {
      this.currentStatus.participants.push(participant);
    }

    this.emit("update", this.currentStatus);
  }

  public async updateCurrentUser(participant?: CallParticipant) {
    if (!participant) {
      console.warn('Unable to find participant - updating user with RPC')
      participant = await this.rpc.updateUser();
      if (!participant) {
        console.warn('Unable to find current user')
        return
      }
    }

    this.currentStatus.user = participant;
    this.emit("update", this.currentStatus);
  }

  public removeParticipant(userId: string) {
    this.currentStatus.participants = this.currentStatus.participants.filter(
      (p) => p.id !== userId
    );
    this.emit("update", this.currentStatus);
  }

  public updateSpeakingStatus(userId: string, isSpeaking: boolean) {
    const participant = this.currentStatus.participants.find(
      (p) => p.id === userId
    );
    if (participant) {
      participant.isSpeaking = isSpeaking;
      this.emit("speakingStateChanged", {
        userId: participant.id,
        isSpeaking: isSpeaking,
      });
    } else {
      console.log(`User ${userId} not found in call participants`);
    }
  }

  public async setConnectionStatus(isConnected: boolean) {
    if (this.currentStatus.isConnected != isConnected) {
      this.clearOldSubscriptions()
      this.currentStatus.isConnected = isConnected;
      this.currentStatus.participants = [];
      this.currentStatus.channelId = null;
      this.currentStatus.channel = undefined;
      this.emit("update", this.currentStatus);
      this.emit("connectionStateChanged", isConnected);

      console.log(
        `Call connection status: ${isConnected ? "Connected" : "Disconnected"}`
      );

      if (isConnected) {
        const channel = (await this.rpc.request(
          RPCCommands.GET_SELECTED_VOICE_CHANNEL
        )) as Channel;
        if (channel) {
          this.emit("channelChanged", channel);
          this.setupNewChannel(channel);
        }
      }
    }
  }

  private clearOldSubscriptions = async () => {
    if (!this.activeSubscriptions) return
    this.activeSubscriptions = false
    console.debug('Clearing old subscriptions')
    this.rpc.unsubscribe(RPCEvents.VOICE_STATE_CREATE);
    this.rpc.unsubscribe(RPCEvents.VOICE_STATE_UPDATE);
    this.rpc.unsubscribe(RPCEvents.VOICE_STATE_DELETE);
    this.rpc.unsubscribe(RPCEvents.SPEAKING_START);
    this.rpc.unsubscribe(RPCEvents.SPEAKING_STOP);
  }


  private async setupChannelSpecificSubscriptions(channelId: string) {
    await this.clearOldSubscriptions()
    this.rpc.subscribe(RPCEvents.VOICE_STATE_CREATE, channelId);
    this.rpc.subscribe(RPCEvents.VOICE_STATE_UPDATE, channelId);
    this.rpc.subscribe(RPCEvents.VOICE_STATE_DELETE, channelId);
    this.rpc.subscribe(RPCEvents.SPEAKING_START, channelId);
    this.rpc.subscribe(RPCEvents.SPEAKING_STOP, channelId);
    this.activeSubscriptions = true
  }

  public async setupNewChannel(channel: Channel) {
    this.updateChannelId(channel.id);
    this.setupChannelSpecificSubscriptions(channel.id);
    this.currentStatus.channelId = channel.id;
    if (channel.voice_states) {
      for (const voiceState of channel.voice_states) {
        const participate: CallParticipant = {
          id: voiceState.user.id,
          profileUrl: await getEncodedImage(
            voiceState.user?.avatar,
            ImageType.UserAvatar,
            voiceState.user.id
          ),
          username:
            voiceState?.nick ||
            voiceState?.user?.username ||
            voiceState.user.id,
          isSpeaking: false,
          isMuted: voiceState.voice_state.mute,
          isDeafened: voiceState.voice_state.deaf,
        };
        this.updateParticipant(participate);
      }
    }

    this.currentStatus.channel = {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      guild_id: channel.guild_id,
      topic: channel.topic,
      bitrate: channel.bitrate,
      user_limit: channel.user_limit,
    };

    this.emit("channelChanged", channel);
    console.log(`Call channel setup: ${channel.name}`);
    this.emit("update", this.currentStatus);
  }

  public getStatus(): CallStatus {
    return this.currentStatus;
  }

  public clearStatus() {
    this.currentStatus = {
      channelId: null,
      participants: [],
      isConnected: false,
      timestamp: Date.now(),
      user: this.currentStatus.user,
      channel: undefined,
    };

    this.emit("update", this.currentStatus);
    console.log("Call status cleared");
  }
}
