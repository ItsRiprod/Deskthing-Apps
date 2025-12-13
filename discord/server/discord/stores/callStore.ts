import {
  Channel,
  RPCCommands,
  RPCEvents,
  VoiceStateCreate,
  VoiceStateObject,
} from "../types/discordApiTypes";
import { getEncodedImage, ImageType } from "../utils/imageFetch";
import { CallStatus, CallParticipant } from "../../../shared/types/discord";
import { DiscordRPCStore } from "./rpcStore";
import { EventEmitter } from "node:events";
import { DeskThing } from "@deskthing/server";

const fallbackDisplayName = (
  opts: { nick?: string | null; global_name?: string | null; username?: string; id: string },
) => {
  return opts.nick || opts.global_name || opts.username || opts.id;
};

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
  private channelCache: Map<string, Channel> = new Map();
  private memberDisplayCache: Map<string, string> = new Map(); // key: `${guildId}:${userId}`
  private forceDisconnected = false;
  private refreshTimers: NodeJS.Timeout[] = [];
  private lastChannelId: string | null = null;
  private pendingDisconnectTimer: NodeJS.Timeout | null = null;
  private switchingChannelId: string | null = null;
  private switchingTimer: NodeJS.Timeout | null = null;
  private subscriptionChannelId: string | null = null;
  private subscriptionAttempts: number = 0;
  private subscriptionMaxAttempts = 3;
  private subscriptionDegraded = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private log = (...args: any[]) => {
    // Ensure logs surface in DeskThing server log stream
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

  private resolveDisplayName(opts: {
    nick?: string | null;
    global_name?: string | null;
    username?: string;
    id: string;
    guildId?: string | null;
    fallback?: string;
  }) {
    const cacheKey = opts.guildId ? `${opts.guildId}:${opts.id}` : undefined;
    const cached = cacheKey ? this.memberDisplayCache.get(cacheKey) : undefined;
    const resolved = fallbackDisplayName({
      nick: opts.nick ?? cached,
      global_name: opts.global_name,
      username: opts.username,
      id: opts.id,
    }) || opts.fallback || opts.id;
    if (cacheKey) {
      this.memberDisplayCache.set(cacheKey, resolved);
    }
    return resolved;
  }

  constructor(rpc: DiscordRPCStore) {
    super();
    this.rpc = rpc;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.rpc.on(
      RPCEvents.VOICE_STATE_CREATE,
      async (data: VoiceStateCreate) => {
        this.log(`Voice state created for user ${data.user.id}`);
        const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username,
          displayName: this.resolveDisplayName({
            nick: data.nick,
            global_name: (data.user as any)?.global_name,
            username: data.user.username,
            id: data.user.id,
            guildId: this.currentStatus.channel?.guild_id,
          }),
          isMuted:
            data.mute || data.voice_state.mute || data.voice_state.self_mute,
          isDeafened: data.voice_state.deaf || data.voice_state.self_deaf,
          isSpeaking: false,
        };
        this.updateParticipant(participant);
        this.emit("participantJoined", participant);
      }
    );

    this.rpc.on(RPCEvents.VOICE_CHANNEL_SELECT, async (data) => {
      if (!data.channel_id) {
        this.forceDisconnected = true;
        await this.setConnectionStatus(false);
        this.updateChannelId(null);
        this.emit("update", this.currentStatus);
        return;
      }

      // Mark that we're in the middle of a channel switch so we don't nuke state on transient disconnects.
      this.switchingChannelId = data.channel_id;
      if (this.switchingTimer) clearTimeout(this.switchingTimer);
      this.switchingTimer = setTimeout(() => {
        this.switchingChannelId = null;
        this.switchingTimer = null;
      }, 4000);

      // If we get a channel id without full details, try to fetch the full channel info.
      this.updateChannelId(data.channel_id);
      const fetchedChannel = await this.fetchChannelDetails(data.channel_id, true);
      if (fetchedChannel) {
        this.currentStatus.channel = {
          id: fetchedChannel.id,
          name: fetchedChannel.name ?? "Unknown Channel",
          type: fetchedChannel.type,
          guild_id: fetchedChannel.guild_id ?? undefined,
          topic: fetchedChannel.topic,
          bitrate: fetchedChannel.bitrate,
          user_limit: fetchedChannel.user_limit,
        };
      } else {
        this.currentStatus.channel = {
          id: data.channel_id,
          name: this.currentStatus.channel?.name ?? "Unknown Channel",
          type: data.guild_id ? 2 : 0,
          guild_id: data.guild_id ?? undefined,
        };
      }
      this.emit("channelChanged", this.currentStatus.channel);
      this.emit("update", this.currentStatus);
    });

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
          displayName: this.resolveDisplayName({
            nick: data.nick,
            global_name: (data.user as any)?.global_name,
            username: data.user.username,
            id: data.user.id,
            guildId: this.currentStatus.channel?.guild_id,
          }),
          isDeafened: this.currentStatus.user?.isDeafened || false,
          isMuted: this.currentStatus.user?.isMuted || false,
          isSpeaking: false,
        }
      const subscribed = await this.rpc.subscribe(
        RPCEvents.VOICE_SETTINGS_UPDATE
      );
      if (!subscribed) {
        this.warn(
          "Voice settings subscription pending retry after READY event"
        );
      }
      this.updateCurrentUser(participant)
    })

    this.rpc.on(
      RPCEvents.VOICE_STATE_UPDATE,
      async (data: VoiceStateCreate) => {
        this.log(`Voice state updated for user ${data.user.id}`);
        const participant: CallParticipant = {
          id: data.user.id,
          profileUrl: await getEncodedImage(
            data.user.avatar,
            ImageType.UserAvatar,
            data.user.id
          ),
          username: data.user.username,
          displayName: this.resolveDisplayName({
            nick: data.nick,
            global_name: (data.user as any)?.global_name,
            username: data.user.username,
            id: data.user.id,
            guildId: this.currentStatus.channel?.guild_id,
          }),
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
      this.log(`User ${data.user_id} started speaking`);
      this.updateSpeakingStatus(data.user_id, true);
    });

    this.rpc.on(RPCEvents.SPEAKING_STOP, (data: { user_id: string }) => {
      this.log(`User ${data.user_id} stopped speaking`);
      this.updateSpeakingStatus(data.user_id, false);
    });

    this.rpc.on(RPCEvents.VOICE_CONNECTION_STATUS, async (data) => {
      const isConnected = data.state === "VOICE_CONNECTED";
      this.setConnectionStatus(isConnected);
      if (!isConnected) {
        if (this.switchingChannelId) {
          this.log(
            `[voice-conn] Ignoring disconnect while switching to ${this.switchingChannelId}`
          );
          return;
        }
        this.updateChannelId(null);
        // Fetch once to ensure we clear state if Discord RPC lags on events
        try {
          const selected = (await this.rpc.request(
            RPCCommands.GET_SELECTED_VOICE_CHANNEL
          )) as Channel | undefined;
          if (!selected) {
            this.clearStatus();
          }
        } catch (err) {
          this.warn(`[disconnect] Failed to verify selected channel after disconnect: ${err}`);
        }
      }
      this.updateCurrentUser(this.rpc.user || undefined);
    });

    this.rpc.on(RPCEvents.VOICE_SETTINGS_UPDATE, (settings) => {
      const isMuted = Boolean(settings.deaf || settings.mute);
      const isDeafened = Boolean(settings.deaf);

      if (this.currentStatus.user) {
        this.updateCurrentUser({
          ...this.currentStatus.user,
          isMuted,
          isDeafened,
        });
      } else {
        this.updateCurrentUser();
      }
    });

    // Listen for connection status and channel select changes.
    this.rpc.subscribe(RPCEvents.VOICE_CONNECTION_STATUS);
    this.rpc.subscribe(RPCEvents.VOICE_CHANNEL_SELECT);
  }

  public updateChannelId(channelId: string | null) {
    const prevId = this.currentStatus.channelId;
    // Any positive channel update cancels a pending disconnect clear.
    if (this.pendingDisconnectTimer) {
      clearTimeout(this.pendingDisconnectTimer);
      this.pendingDisconnectTimer = null;
    }
    this.currentStatus.channelId = channelId;
    this.currentStatus.timestamp = Date.now();
    if (!channelId) {
      this.currentStatus.participants = [];
      this.currentStatus.isConnected = false;
      this.currentStatus.channel = undefined;
      this.emit("channelChanged", undefined);
      this.channelCache.clear();
      this.memberDisplayCache.clear();
      this.lastChannelId = null;
      this.subscriptionAttempts = 0;
      this.subscriptionDegraded = false;
      this.subscriptionChannelId = null;
      this.clearPolling();
    } else {
      // On channel switch, clear stale participants/caches so we don't show old data.
      if (prevId && prevId !== channelId) {
        this.log(
          `[channel-switch] ${prevId} -> ${channelId}; clearing participant list and caches`
        );
        this.currentStatus.participants = [];
        this.memberDisplayCache.clear();
        // Clear all cached channels to avoid stale names, then refetch fresh details.
        this.channelCache.clear();
        this.subscriptionAttempts = 0;
        this.subscriptionDegraded = false;
        this.subscriptionChannelId = channelId;
        this.clearPolling();
      }
      this.lastChannelId = channelId;
    }

    this.log(`Call channel ID updated: ${channelId || "None"}`);
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
        this.warn('Unable to find participant - updating user with RPC')
      participant = await this.rpc.updateUser();
      if (!participant) {
        this.warn('Unable to find current user')
        return
      }
    }

    const guildId = this.currentStatus.channel?.guild_id;
    participant.displayName = this.resolveDisplayName({
      nick: (participant as any).nick,
      global_name: (participant as any)?.global_name,
      username: participant.username,
      id: participant.id,
      guildId,
      fallback: participant.displayName,
    });

    this.currentStatus.user = participant;
    const userIndex = this.currentStatus.participants.findIndex(
      (p) => p.id === participant.id
    );
    if (this.currentStatus.isConnected) {
      if (userIndex !== -1) {
        this.currentStatus.participants[userIndex] = {
          ...this.currentStatus.participants[userIndex],
          ...participant,
        };
      } else {
        this.currentStatus.participants.push(participant);
      }
    } else if (userIndex !== -1) {
      this.currentStatus.participants.splice(userIndex, 1);
    }

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
      this.log(`User ${userId} not found in call participants`);
    }
  }

  public async setConnectionStatus(isConnected: boolean) {
    if (this.currentStatus.isConnected === isConnected) {
      if (!isConnected) {
        this.forceDisconnected = true;
        this.clearStatus();
      }
      return;
    }

    if (!isConnected) {
      // Debounce disconnect to avoid thrash during channel switches.
      if (this.switchingChannelId) {
        this.log(
          `[disconnect] Ignoring disconnect while switching to ${this.switchingChannelId}`
        );
        return;
      }
      if (this.pendingDisconnectTimer) return;
      this.pendingDisconnectTimer = setTimeout(async () => {
        this.pendingDisconnectTimer = null;
        if (this.currentStatus.isConnected) return; // already reconnected
        await this.clearOldSubscriptions();
        this.currentStatus.isConnected = false;
        this.currentStatus.participants = [];
        this.currentStatus.channelId = null;
        this.currentStatus.channel = undefined;
        this.forceDisconnected = true;
        this.emit("update", this.currentStatus);
        this.emit("connectionStateChanged", false);
        this.log("Call connection status: Disconnected (debounced)");
      }, 800);
      return;
    }

    // Connected path
    if (this.pendingDisconnectTimer) {
      clearTimeout(this.pendingDisconnectTimer);
      this.pendingDisconnectTimer = null;
    }
    if (this.switchingTimer) {
      // Keep switchingChannelId; don't clear it yet.
    }

    await this.clearOldSubscriptions();
    this.currentStatus.isConnected = true;
    this.currentStatus.participants = [];
    this.currentStatus.channelId = null;
    this.currentStatus.channel = undefined;
    this.emit("update", this.currentStatus);
    this.emit("connectionStateChanged", true);

    this.log("Call connection status: Connected");

    this.forceDisconnected = false;
    let channel = (await this.rpc.request(
      RPCCommands.GET_SELECTED_VOICE_CHANNEL
    )) as Channel | undefined;
    if (!channel && this.currentStatus.channelId) {
      channel = await this.fetchChannelDetails(this.currentStatus.channelId, true);
    }
    if (channel) {
      // Clear switching flag once we have the new channel in hand.
      this.switchingChannelId = null;
      if (this.switchingTimer) {
        clearTimeout(this.switchingTimer);
        this.switchingTimer = null;
      }
      this.emit("channelChanged", channel);
      await this.setupNewChannel(channel);
    }
  }

  private clearOldSubscriptions = async () => {
    if (!this.activeSubscriptions) return;
    this.activeSubscriptions = false;
    this.subscriptionChannelId = null;
    console.debug("Clearing old subscriptions");
    await Promise.all([
      this.rpc.unsubscribe(RPCEvents.VOICE_STATE_CREATE),
      this.rpc.unsubscribe(RPCEvents.VOICE_STATE_UPDATE),
      this.rpc.unsubscribe(RPCEvents.VOICE_STATE_DELETE),
      this.rpc.unsubscribe(RPCEvents.SPEAKING_START),
      this.rpc.unsubscribe(RPCEvents.SPEAKING_STOP),
    ]);
  };


  private async setupChannelSpecificSubscriptions(channelId: string) {
    if (this.subscriptionChannelId === channelId && this.activeSubscriptions && !this.subscriptionDegraded) {
      this.log(`[subscribe] Already subscribed for ${channelId}; skipping re-subscribe`);
      return;
    }
    // If we're already in degraded mode for this channel, skip resubscribing and keep polling.
    if (this.subscriptionDegraded && this.subscriptionChannelId === channelId) {
      this.warn(
        `[subscribe] Skipping resubscribe for ${channelId} (degraded); continuing polling only`
      );
      this.startPollingParticipants(channelId);
      return;
    }

    if (this.subscriptionChannelId !== channelId) {
      this.subscriptionAttempts = 0;
      this.subscriptionDegraded = false;
      this.subscriptionChannelId = channelId;
      this.clearPolling();
    }

    await this.clearOldSubscriptions();
    try {
      const results = await Promise.all([
        this.trySubscribe(RPCEvents.VOICE_STATE_CREATE, channelId),
        this.trySubscribe(RPCEvents.VOICE_STATE_UPDATE, channelId),
        this.trySubscribe(RPCEvents.VOICE_STATE_DELETE, channelId),
        this.trySubscribe(RPCEvents.SPEAKING_START, channelId),
        this.trySubscribe(RPCEvents.SPEAKING_STOP, channelId),
      ]);
      this.activeSubscriptions = results.some((result) => result);
      if (!this.activeSubscriptions) {
        this.subscriptionAttempts += 1;
        if (this.subscriptionAttempts >= this.subscriptionMaxAttempts) {
          this.subscriptionDegraded = true;
          this.warn(
            `[subscribe] Voice event subscriptions degraded after ${this.subscriptionAttempts} attempts for ${channelId}; falling back to polling`
          );
          this.startPollingParticipants(channelId);
        } else {
          this.warn(
            `[subscribe] Voice event subscriptions pending retry (${this.subscriptionAttempts}/${this.subscriptionMaxAttempts})`
          );
        }
      } else {
        this.subscriptionAttempts = 0;
        this.subscriptionDegraded = false;
        this.clearPolling();
      }
    } catch (error) {
      this.activeSubscriptions = false;
      this.subscriptionAttempts += 1;
      this.warn(
        `[subscribe] Failed to subscribe to voice events for channel ${channelId}: ${error}`
      );
      if (this.subscriptionAttempts >= this.subscriptionMaxAttempts) {
        this.subscriptionDegraded = true;
        this.startPollingParticipants(channelId);
      }
      throw error;
    }
  }

  private async fetchChannelDetails(channelId: string, forceRefresh = false): Promise<Channel | undefined> {
    try {
      if (!forceRefresh && this.channelCache.has(channelId)) {
        return this.channelCache.get(channelId);
      }
      const channel = (await this.rpc.request(RPCCommands.GET_CHANNEL, {
        channel_id: channelId,
      })) as Channel;
      if (channel) {
        this.log(
          `[channel-fetch] ${forceRefresh ? "refreshed" : "fetched"} ${channel.id} :: ${channel.name ?? "Unknown"} (guild ${channel.guild_id ?? "DM"})`
        );
        this.channelCache.set(channelId, channel);
      }
      return channel;
    } catch (error) {
      this.warn(`Failed to fetch channel ${channelId}: ${error}`);
      return undefined;
    }
  }

  private async refreshParticipants(channelId: string) {
    try {
      const refreshed = await this.fetchChannelDetails(channelId, true);
      if (refreshed?.voice_states?.length) {
        this.log(
          `[call-init] Refreshing participants from channel fetch (${refreshed.voice_states.length} states)`
        );
        await this.populateParticipants(refreshed);
      } else {
        this.warn(`[call-init] Refresh fetch returned no voice_states for ${channelId}`);
      }
    } catch (err) {
      this.warn(`[call-init] Failed to refresh participants for ${channelId}: ${err}`);
    }
  }

  private async fetchVoiceStatesFallback(channelId: string): Promise<VoiceStateObject[] | undefined> {
    try {
      const selected = await this.fetchSelectedVoiceChannel();
      const statesFromSelected =
        selected?.id === channelId ? selected.voice_states ?? [] : [];

      const refreshed = await this.fetchChannelDetails(channelId, true);
      const statesFromChannel = refreshed?.voice_states ?? [];

      const merged = [...statesFromSelected, ...statesFromChannel];
      if (merged.length) {
        this.log(
          `[call-init] Fallback merged voice_states count=${merged.length} (selected=${statesFromSelected.length}, channel=${statesFromChannel.length})`
        );
        // De-dup by user id
        const seen = new Set<string>();
        return merged.filter((vs) => {
          if (!vs.user?.id) return false;
          if (seen.has(vs.user.id)) return false;
          seen.add(vs.user.id);
          return true;
        });
      }
    } catch (err) {
      this.warn(`[call-init] Fallback voice state fetch failed for ${channelId}: ${err}`);
    }
    return undefined;
  }

  private async trySubscribe(
    event: RPCEvents,
    channelId: string,
    retries: number = 2,
    delayMs: number = 350
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const ok = await this.rpc.subscribe(event, channelId);
        if (ok) return true;
        this.warn(
          `[subscribe] ${event} attempt ${attempt}/${retries} failed for ${channelId} (returned false)`
        );
      } catch (err) {
        this.warn(
          `[subscribe] ${event} attempt ${attempt}/${retries} errored for ${channelId}: ${err}`
        );
      }
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
    return false;
  }

  private scheduleParticipantRefreshes(channelId: string) {
    // Clear any previous timers
    this.refreshTimers.forEach((t) => clearTimeout(t));
    this.refreshTimers = [];

    // Staggered refresh to catch late-arriving voice_states
    const delays = [900, 2000, 4000];
    delays.forEach((delay) => {
      const timer = setTimeout(() => {
        if (!this.forceDisconnected) {
          this.refreshParticipants(channelId);
        }
      }, delay);
      this.refreshTimers.push(timer);
    });
  }

  private startPollingParticipants(channelId: string) {
    this.clearPolling();
    this.pollTimer = setInterval(() => {
      if (this.forceDisconnected) return;
      this.refreshParticipants(channelId);
    }, 2500);
    this.warn(`[poll] Started participant polling for ${channelId}`);
  }

  private async fetchSelectedVoiceChannel(): Promise<Channel | undefined> {
    try {
      const selected = (await this.rpc.request(
        RPCCommands.GET_SELECTED_VOICE_CHANNEL
      )) as Channel | undefined;
      if (selected?.id) {
        this.log(
          `[channel-selected] ${selected.id} ${selected.name ?? "Unknown"} (guild ${selected.guild_id ?? "DM"})`
        );
      } else {
        this.warn("[channel-selected] No selected voice channel returned");
      }
      return selected;
    } catch (err) {
      this.warn(`[channel-selected] Failed to fetch selected voice channel: ${err}`);
      return undefined;
    }
  }

  private async ensureSelfVoiceState() {
    try {
      this.log("[call-init] Fetching self voice settings/state");
      await this.updateCurrentUser();
    } catch (err) {
      this.warn(`[call-init] Failed to fetch self voice state: ${err}`);
    }
  }

  private clearPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public async refreshCurrentChannel(reason: string = "manual-refresh") {
    try {
      this.log(`[${reason}] Forcing channel refresh`);
      const selected = await this.fetchSelectedVoiceChannel();
      if (!selected?.id) {
        this.warn(`[${reason}] No selected voice channel found`);
        return;
      }
      // Treat this as an intentional switch.
      this.switchingChannelId = selected.id;
      if (this.switchingTimer) clearTimeout(this.switchingTimer);
      this.switchingTimer = setTimeout(() => {
        this.switchingChannelId = null;
        this.switchingTimer = null;
      }, 4000);

      this.updateChannelId(selected.id);
      await this.ensureSelfVoiceState();
      await this.setupChannelSpecificSubscriptions(selected.id);
      await this.populateParticipants(selected);
      const refreshed = (await this.fetchChannelDetails(selected.id, true)) ?? selected;
      this.updateChannelMetadata(refreshed);
      this.scheduleParticipantRefreshes(selected.id);
      this.emit("update", this.currentStatus);
      this.log(`[${reason}] Channel refresh complete for ${selected.id}`);
    } catch (err) {
      this.warn(`[${reason}] Failed to refresh channel: ${err}`);
    }
  }

  private async populateParticipants(channel: Channel) {
    // Prefer the freshest channel data (may include voice_states)
    let sourceChannel = channel;
    if (!channel.voice_states || channel.voice_states.length === 0) {
      const refreshed = await this.fetchChannelDetails(channel.id, true);
      if (refreshed?.voice_states?.length) {
        sourceChannel = refreshed;
      }
    }
    if (!sourceChannel.voice_states || sourceChannel.voice_states.length === 0) {
      const selected = await this.fetchSelectedVoiceChannel();
      if (selected?.id === channel.id && selected.voice_states?.length) {
        sourceChannel = selected;
      }
    }
    if (!sourceChannel.voice_states || sourceChannel.voice_states.length === 0) {
      const fallback = await this.fetchVoiceStatesFallback(channel.id);
      if (fallback?.length) {
        sourceChannel = { ...sourceChannel, voice_states: fallback };
        this.log(
          `[call-init] Using fallback voice_states (${fallback.length}) for channel ${channel.id}`
        );
      } else {
        this.warn(`[call-init] No voice_states found for channel ${channel.id}`);
        return;
      }
    }

    const participants = await Promise.all(
      sourceChannel.voice_states.map(async (voiceState) => {
        const profileUrl = await getEncodedImage(
          voiceState.user?.avatar,
          ImageType.UserAvatar,
          voiceState.user.id
        );

        const participant: CallParticipant = {
          id: voiceState.user.id,
          profileUrl,
          username:
            voiceState?.nick ||
            voiceState?.user?.username ||
            voiceState.user.id,
          displayName: this.resolveDisplayName({
            nick: voiceState?.nick ?? voiceState?.member?.nick,
            global_name: (voiceState?.member?.user as any)?.global_name ??
              (voiceState.user as any)?.global_name,
            username: voiceState?.user?.username,
            id: voiceState.user.id,
            guildId: sourceChannel.guild_id,
          }),
          isSpeaking: false,
          isMuted:
            Boolean(voiceState.voice_state.mute) ||
            Boolean(voiceState.voice_state.self_mute),
          isDeafened:
            Boolean(voiceState.voice_state.deaf) ||
            Boolean(voiceState.voice_state.self_deaf),
        };

        return participant;
      })
    );

    participants.forEach((participant) => this.updateParticipant(participant));
  }

  private updateChannelMetadata(channel: Channel) {
    this.currentStatus.channel = {
      id: channel.id,
      name: channel.name ?? "Unknown Channel",
      type: channel.type,
      guild_id: channel.guild_id,
      topic: channel.topic,
      bitrate: channel.bitrate,
      user_limit: channel.user_limit,
    };
    this.emit("channelChanged", this.currentStatus.channel);
    if (!channel.name) {
      this.warn(
        `[channel-meta] Channel name missing for ${channel.id}; using fallback 'Unknown Channel' (guild ${channel.guild_id ?? "DM"})`
      );
    } else {
      this.log(
        `[channel-meta] Channel set to ${channel.name} (id=${channel.id}, guild=${channel.guild_id ?? "DM"})`
      );
    }
  }

  public async setupNewChannel(channel: Channel) {
    if (this.forceDisconnected) {
      console.warn("Ignoring setupNewChannel because disconnect was forced");
      return;
    }
    this.log(`[call-init] Starting channel setup for ${channel.id} (${channel.name ?? "Unknown"})`);

    // 1) Update channel id immediately so UI can react
    this.updateChannelId(channel.id);

    // 2) Prioritize self mute/deaf status
    await this.ensureSelfVoiceState();

    // 3) Subscribe to voice events (participants + speaking)
    await this.setupChannelSpecificSubscriptions(channel.id);
    this.currentStatus.channelId = channel.id;

    // 4) Populate participants
    const bestChannel =
      (channel.voice_states?.length ? channel : await this.fetchChannelDetails(channel.id, true)) ??
      channel;
    if (!bestChannel.name) {
      this.warn(
        `[call-init] Channel arrived without name (id=${bestChannel.id}, guild=${bestChannel.guild_id ?? "DM"})`
      );
    }
    await this.populateParticipants(bestChannel);

    // 5) Refresh channel metadata (name/guild/topic)
    const refreshed = (await this.fetchChannelDetails(channel.id, true)) ?? bestChannel;
    this.updateChannelMetadata(refreshed);

    // 6) Schedule a short follow-up refresh to catch late-arriving voice_state data
    this.scheduleParticipantRefreshes(channel.id);

    // 7) Schedule a metadata refresh in case name/guild was absent initially
    setTimeout(async () => {
      if (this.pendingDisconnectTimer) return;
      if (this.forceDisconnected) return;
      const metaRefresh = await this.fetchChannelDetails(channel.id, true);
      if (metaRefresh) {
        this.updateChannelMetadata(metaRefresh);
      }
    }, 1500);

    this.log(`Call channel setup: ${refreshed.name ?? channel.name ?? channel.id}`);
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
    this.log("Call status cleared");
  }
}
