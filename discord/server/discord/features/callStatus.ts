import { DeskThing } from "@deskthing/server";
import { Channel } from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { CallStatus, CallParticipant } from "@shared/types/discord";

export class CallStatusManager {
  private currentStatus: CallStatus = {
    channelId: null,
    participants: [],
    isConnected: false,
    timestamp: Date.now(),
    channel: undefined,
    user: undefined,
  };
  private debounceTimeoutId: NodeJS.Timeout | null = null;
  private debounceFlag = false;

  constructor() {}

  public updateChannelId(channelId: string | null) {
    this.currentStatus.channelId = channelId;
    this.currentStatus.timestamp = Date.now();
    if (!channelId) {
      this.currentStatus.participants = [];
      this.currentStatus.isConnected = false;
      this.currentStatus.channel = undefined;
    }

    DeskThing.sendLog(`Call channel ID updated: ${channelId || "None"}`);
  }

  private updateClient = () => {
    DeskThing.send({
      type: "call",
      payload: this.currentStatus,
      request: "set",
    });
  };

  private updateClientSpeaking = (userId: string, isSpeaking: boolean) => {
    DeskThing.send({
      type: "call",
      payload: { userId, isSpeaking },
      request: "update",
    });
  };

  public debounceUpdateClient = () => {
    // If this is the first update, send it immediately
    if (!this.debounceFlag) {
      DeskThing.sendLog("Updating client with new call status (first)");
      this.updateClient();
      this.debounceFlag = true;
    } else {      
      if (this.debounceTimeoutId) {
        clearTimeout(this.debounceTimeoutId);
      }
      this.debounceTimeoutId = setTimeout(() => {
        DeskThing.sendLog("Updating client with new call status (second)");
        this.updateClient();
        this.debounceTimeoutId = null;
        this.debounceFlag = false;
      }, 1000); // update with a second delay
    }
  };

  public async updateParticipant(participant: CallParticipant): Promise<void> {
    if (participant.id == this.currentStatus?.user?.id) {
      this.updateCurrentUser(participant);
    }
    const index = this.currentStatus.participants.findIndex(
      (p) => p.id === participant.id
    );
    if (index !== -1) {
      console.log("Updating participant", participant);
      this.currentStatus.participants[index] = participant;
    } else {
      console.log("Adding participant", participant);
      this.currentStatus.participants.push(participant);
    }

    this.debounceUpdateClient();
  }

  public updateCurrentUser(participant: CallParticipant) {
    this.currentStatus.user = participant;
    this.debounceUpdateClient();
  }

  public removeParticipant(userId: string) {
    this.currentStatus.participants = this.currentStatus.participants.filter(
      (p) => p.id !== userId
    );

    this.debounceUpdateClient();
  }

  public updateSpeakingStatus(userId: string, isSpeaking: boolean) {
    const participant = this.currentStatus.participants.find(
      (p) => p.id === userId
    );
    if (participant) {
      DeskThing.sendLog(`User ${userId} is ${isSpeaking ? 'speaking' : 'not speaking'}`);
      participant.isSpeaking = isSpeaking;
      this.updateClientSpeaking(userId, isSpeaking);
    } else {
      DeskThing.sendLog(`User ${userId} not found in call participants`);
    }

  }

  public setConnectionStatus(isConnected: boolean) {
    if (this.currentStatus.isConnected != isConnected) {

      this.currentStatus.isConnected = isConnected;
      this.currentStatus.participants = [];
      this.currentStatus.channelId = null;
      this.currentStatus.channel = undefined;
      this.debounceUpdateClient();
      
      DeskThing.sendLog(
        `Call connection status: ${isConnected ? "Connected" : "Disconnected"}`
      );
    }
  }

  public async setupNewChannel(channel: Channel) {
    this.updateChannelId(channel.id)
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
          isSpeaking: false, // we can't figure it out from the voiceState object
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

    DeskThing.sendLog(`Call channel setup: ${channel.name}`);

    this.debounceUpdateClient();
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

    DeskThing.sendLog("Call status cleared");
  }
}
