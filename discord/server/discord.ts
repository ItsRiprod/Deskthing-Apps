import RPC, { Channel, Subscription, User } from "@ankziety/discord-rpc";
import { DeskThing } from "deskthing-server";

type ACTION_TYPES = "speaking" | "connect" | "disconnect" | "update" | "status";

interface userData {
  id: string | undefined;
  username?: string | undefined;
  nick?: string | undefined;
  speaking?: boolean | undefined;
  volume?: number | undefined;
  avatar?: string | undefined;
  mute?: boolean | undefined;
  deaf?: boolean | undefined;
  profile?: string | undefined;
}

interface voiceState {
  mute: boolean;
  deaf: boolean;
  self_mute: boolean;
  self_deaf: boolean;
  suppress: boolean;
}

type discordData = {
  action: ACTION_TYPES;
  user: User;
  voice_state: voiceState;
  speaking: boolean;
  nick: string;
  volume: number;
  mute: boolean;
  [key: string]: string | boolean | undefined | User | voiceState | number;
};

type subscriptions = {
  voice: { [key: string]: Subscription[] };
};

type notificationData = {
  title: string;
};

class DiscordHandler {
  private DeskThingServer: DeskThing;
  private rpc: RPC.Client = new RPC.Client({ transport: "ipc" });
  private subscriptions: subscriptions = { voice: {} };
  private startTimestamp: Date | null;
  private redirect_url: string;
  private scopes: string[];
  private client_id: string | undefined = undefined;
  private client_secret: string | undefined = undefined;
  private token: string | undefined = undefined;
  private cachedUsers: userData[];
  private selectedChannel: Channel = null;
  private recentChannels: Channel[];

  constructor(DeskThing: DeskThing) {
    this.DeskThingServer = DeskThing;
    // Initialize properties
    this.subscriptions = { voice: {} };
    this.startTimestamp = null;
    this.cachedUsers = [];
    this.redirect_url = "http://localhost:8888/callback/discord";
    // Define the scopes required for Discord RPC
    this.scopes = [
      "rpc",
      "rpc.voice.read",
      "rpc.activities.write",
      "rpc.voice.write",
      "rpc.notifications.read",
      "messages.read",
    ];
  }

  // Register the RPC client and login
  async registerRPC() {
    try {
      this.DeskThingServer.sendLog(
        "Registering RPC over IPC and logging in..."
      );
      this.DeskThingServer.sendLog("Why so many acronyms?");
      const data = await this.DeskThingServer.getData();
      if (data) {
        this.client_id = data.client_id as string;
        this.client_secret = data.client_secret as string;
        this.token = data.token as string;
      }

      if (!this.client_id || !this.client_secret) {
        this.DeskThingServer.sendError("Missing client ID or secret");
        throw new Error("Missing client ID or secret");
      }

      RPC.register(this.client_id);
      await this.unsubscribe();
      this.subscriptions = { voice: {} };
      await this.initializeRpc();
      await this.login();
    } catch (exception) {
      this.DeskThingServer.sendError(
        `RPC: Error registering RPC client: ${exception}`
      );
    }
  }

  // Login to Discord RPC
  async login() {
    try {
      if (!this.client_id || !this.client_secret) return;

      await this.rpc.connect(this.client_id);

      if (!this.token) {
        // Authorize and get the access token
        // @ts-ignore - The 'authorize' method may not be in the type definitions
        this.token = await this.rpc.authorize({
          scopes: this.scopes,
          clientSecret: this.client_secret,
          redirectUri: this.redirect_url,
        });
        this.DeskThingServer.saveData({ token: this.token });
      }

      await this.rpc.login({
        scopes: this.scopes,
        clientId: this.client_id,
        clientSecret: this.client_secret,
        redirectUri: this.redirect_url,
        accessToken: this.token,
      });

      this.DeskThingServer.sendLog("RPC: @login Auth Successful");
    } catch (exception) {
      this.DeskThingServer.sendError(`Discord RPC Error: ${exception}`);
    }
  }

  // Initialize RPC event handlers and subscriptions
  async initializeRpc() {
    this.DeskThingServer.sendLog("RPC Initializing...");
    try {
      this.rpc.on("ready", async () => {
        this.DeskThingServer.sendLog(
          "RPC ready! Setting activity and subscribing to events"
        );
        const setActivity = (await this.DeskThingServer.getData())?.settings
          ?.activity?.value;
        if (setActivity) {
          const cancelTask = this.DeskThingServer.addBackgroundTaskLoop(
            async () => {
              this.rpc.clearActivity();
              await this.setActivity();
              this.DeskThingServer.sendLog("Activity was set...");
              await new Promise((resolve) => setTimeout(resolve, 30000));
            }
          );
        } else {
          this.DeskThingServer.sendLog("Not starting Activity due to settings");
        }
        this.setSubscribe();
      });

      // Handle voice channel selection events
      this.rpc.on("VOICE_CHANNEL_SELECT", async (args) => {
        await this.handleVoiceChannelSelect(args.channel_id);
      });

      // Handle voice state changes
      this.rpc.on("VOICE_STATE_CREATE", async (args) => {
        await this.handleVoiceStateCreate(args);
      });

      this.rpc.on("VOICE_STATE_DELETE", async (args) => {
        await this.handleVoiceStateDelete(args);
      });

      this.rpc.on("VOICE_STATE_UPDATE", async (args) => {
        await this.handleVoiceStateUpdate(args);
      });

      this.rpc.on("SPEAKING_START", async (args) => {
        await this.handleSpeakingStart(args);
      });

      this.rpc.on("SPEAKING_STOP", async (args) => {
        await this.handleSpeakingStop(args);
      });

      this.rpc.on("VOICE_CONNECTION_STATUS", async (args) => {
        await this.handleVoiceConnectionStatus(args);
      });

      this.rpc.on("NOTIFICATION_CREATE", async (args) => {
        this.DeskThingServer.sendLog(JSON.stringify(args));
      });

      this.rpc.on("error", (error) => {
        this.DeskThingServer.sendError(`RPC Error: ${error.message}`);
      });

      this.rpc.on("disconnected", async (closeEvent) => {
        this.DeskThingServer.sendError(
          `Disconnected from Discord Error: ${closeEvent}`
        );
        this.DeskThingServer.sendError(
          "RPC Disconnected! Attempting to reconnect..."
        );
        await this.login();
      });

      this.DeskThingServer.sendLog("RPC events setup!");
    } catch (ex) {
      this.DeskThingServer.sendError(`RPC: Error initializing RPC: ${ex}`);
    }
  }

  // Handle when a voice channel is selected
  async handleVoiceChannelSelect(channelId: string) {
    if (channelId != null && channelId != this.selectedChannel.id) {
      // Unsubscribe from previous voice channel events if any
      await this.handleClientChannelSelect();
    } else
      this.DeskThingServer.sendError(
        `[Server] Joined the same call without leaving ${channelId} ${this.selectedChannel.id}`
      );
  }

  // Add or update a user in the connected users list
  async mergeUserData(newUser: userData) {
    const existingUserIndex = this.cachedUsers.findIndex(
      (user) => user.id === newUser.id
    );

    if (existingUserIndex != -1) {
      // Update existing user data
      this.cachedUsers[existingUserIndex] = {
        ...this.cachedUsers[existingUserIndex],
        ...newUser,
      };
      // New user data to mess with

      const userId = this.cachedUsers[existingUserIndex].id;
      const userAvatar = this.cachedUsers[existingUserIndex].avatar;

      // Encode the image and update the user profile
      this.cachedUsers[existingUserIndex] = {
        ...this.cachedUsers[existingUserIndex],
        profile: await this.DeskThingServer.encodeImageFromUrl(
          `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`
        ),
      };

      this.DeskThingServer.sendLog(
        `User ${this.cachedUsers[existingUserIndex].username} has joined the chat`
      );

      // if (sendData) {
      //   this.sendDataToClients(
      //     [this.connectedUsers[existingUserIndex]],
      //     "update"
      //   );
      // }
    } else {
      // Add new user to the list
      this.cachedUsers.push(newUser);
      await this.mergeUserData(newUser);
      // if (sendData) {
      //   this.sendDataToClients([newUser], "update");
      // }
    }
  }

  // Handle when a user joins the voice channel
  async handleVoiceStateCreate(args: discordData) {
    this.DeskThingServer.sendLog(
      `Handling Voice State Create: ${JSON.stringify(args)}`
    );
    const userData = {
      id: args.user.id,
      username: args.user.username,
      nick: args.nick,
      speaking: false,
      volume: args.volume,
      mute: args.mute,
      deaf: args.voice_state.deaf || args.voice_state.self_deaf,
      avatar: args.user.avatar,
      profile: undefined,
    };

    await this.mergeUserData(userData);

    // Send full call data to ensure all clients are in sync
    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "channel_member",
      request: "connect",
      payload: userData,
    });
  }

  // Handle when a user leaves the voice channel
  async handleVoiceStateDelete(args: discordData) {
    this.DeskThingServer.sendLog(
      `Handling Voice State Delete: ${JSON.stringify(args)}`
    );
    // this.cachedUsers = this.cachedUsers.filter(
    //   (user) => user.id !== args.user.id
    // );
    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "channel_member",
      request: "disconnect",
      payload: { id: args.user.id },
    });
    this.DeskThingServer.sendLog(
      `User ${args.user.username} has left the chat`
    );
  }

  // Handle updates to a user's voice state
  async handleVoiceStateUpdate(args: discordData) {
    this.DeskThingServer.sendLog(
      `Handling Voice State Update: ${JSON.stringify(args)}`
    );

    const userData = {
      id: args.user.id,
      username: args.user.username ?? undefined,
      nick: args.nick ?? undefined,
      speaking: false,
      volume: args.volume ?? undefined,
      mute: args.mute,
      deaf: args.voice_state.deaf || args.voice_state.self_deaf,
      avatar: args.user.avatar ?? undefined,
      profile: undefined,
    };

    await this.mergeUserData(userData);

    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "voice_data",
      payload: userData,
    });
  }

  // Handle when a user starts speaking
  async handleSpeakingStart(args: { user_id: string }) {
    this.DeskThingServer.sendLog(
      `Handling Speaking Start for user: ${args.user_id}`
    );
    // Update only speaking state, don't modify other user data
    const existingUser = this.cachedUsers.find(
      (user) => user.id === args.user_id
    );
    if (existingUser) {
      existingUser.speaking = true;
      this.DeskThingServer.sendDataToClient({
        app: "discord",
        payload: { id: args.user_id, speaking: true },
        type: "speaking_data",
      });
    }
  }

  // Handle when a user stops speaking
  async handleSpeakingStop(args: { user_id: string }) {
    this.DeskThingServer.sendLog(
      `Handling Speaking Stop for user: ${args.user_id}`
    );
    const existingUser = this.cachedUsers.find(
      (user) => user.id === args.user_id
    );
    if (existingUser) {
      existingUser.speaking = false;
      this.DeskThingServer.sendDataToClient({
        app: "discord",
        payload: { id: args.user_id, speaking: false },
        type: "speaking_data",
      });
    }
  }

  // Handle voice connection status changes
  async handleVoiceConnectionStatus(args: discordData) {
    this.DeskThingServer.sendLog(
      `Handling Voice Connection Status: ${JSON.stringify(args)}`
    );
    if (args.state === "VOICE_CONNECTED" && this.selectedChannel == null)
      await this.handleClientChannelSelect();
    if (args.state === "CONNECTING") {
      if (
        (await this.DeskThingServer.getData())?.settings?.auto_switch_view
          ?.value
      ) {
        this.DeskThingServer.sendDataToClient({
          app: "client",
          type: "set",
          request: "view",
          payload: "Discord",
        });
      }

      this.DeskThingServer.sendDataToClient({
        app: "discord",
        type: "client_data",
        request: "join",
      });

      await this.handleClientChannelSelect();

      this.DeskThingServer.sendLog("Connecting to a voice channel");
    } else if (args.state === "DISCONNECTED") {
      this.DeskThingServer.sendDataToClient({
        app: "discord",
        type: "client_data",
        request: "leave",
      });

      this.DeskThingServer.sendLog("Unsubscribing from all voice channels");
      await this.unsubscribe();
      this.subscriptions.voice = {};
      this.selectedChannel = null;
    }
  }

  // Unsubscribe from all voice channel events
  async unsubscribe() {
    try {
      for (const channelId of Object.keys(this.subscriptions.voice)) {
        this.subscriptions.voice[channelId].forEach((sub) => sub.unsubscribe());
      }
    } catch (ex) {
      this.DeskThingServer.sendError(
        `Discord RPC Error during unsubscribe: ${ex}`
      );
    }
  }

  // Set the Discord Rich Presence activity
  async setActivity() {
    this.DeskThingServer.sendLog("Setting activity...");
    try {
      if (!this.startTimestamp) {
        this.startTimestamp = new Date();
      }
      const uptimeMs = new Date().getTime() - this.startTimestamp.getTime();
      const msToTime = (duration: number) => {
        const seconds = String(Math.floor((duration / 1000) % 60)).padStart(
          2,
          "0"
        );
        const minutes = String(
          Math.floor((duration / (1000 * 60)) % 60)
        ).padStart(2, "0");
        const hours = String(
          Math.floor((duration / (1000 * 60 * 60)) % 24)
        ).padStart(2, "0");
        return hours !== "00"
          ? `${hours}:${minutes}:${seconds}`
          : `${minutes}:${seconds}`;
      };

      await this.rpc
        .setActivity({
          details: "The Revived Car Thing",
          state: `Developing for ${msToTime(uptimeMs)}`,
          largeImageKey: "emoji_large",
          largeImageText: "Developing",
          smallImageKey: "emoji_small",
          smallImageText: "37683 errors",
          instance: true,
          buttons: [
            {
              label: "Check Out Desk Thing",
              url: "https://github.com/ItsRiprod/carthing/",
            },
          ],
        })
        .catch((error) => {
          this.DeskThingServer.sendError(
            `Failed to set activity: ${error.message}`
          );
        });
      this.DeskThingServer.sendLog("Activity set successfully");
    } catch (ex) {
      this.DeskThingServer.sendError(`Error in setActivity: ${ex}`);
    }
  }

  // Subscribe to necessary Discord RPC events
  async setSubscribe() {
    this.DeskThingServer.sendLog(
      "Subscribing to voice channels and connection status"
    );
    await this.rpc.subscribe("VOICE_CHANNEL_SELECT", {});
    await this.rpc.subscribe("VOICE_CONNECTION_STATUS", {});
    await this.rpc.subscribe("NOTIFICATION_CREATE", {});
  }

  async refreshCallData() {
    this.selectedChannel = await this.rpc.getSelectedChannel();

    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "client_data",
      request: "refresh_call",
      payload: this.getSelectedChannelUsers(),
    });
  }

  // Send data to the connected clients
  // sendDataToClients(
  //   payload: userData[] | notificationData | undefined,
  //   request: string = ""
  // ) {
  //   this.DeskThingServer.sendDataToClient({
  //     app: "discord",
  //     type: "data",
  //     request: request,
  //     payload: payload,
  //   });
  //   this.DeskThingServer.sendLog("[server] Sending data to clients...");
  // }

  // Change voice settings (mute, deafened)
  async setVoiceSetting(data: any) {
    this.DeskThingServer.sendLog(
      `Attempting to change voice setting to: ${JSON.stringify(data)}`
    );
    this.rpc.setVoiceSettings(data);
    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "voice_data",
      payload: {
        id: this.rpc.user?.id,
        ...data.payload,
      },
    });
  }

  async handleClientChannelSelect() {
    this.DeskThingServer.sendLog("[Server] Fetching Discord channel info");
    const channel = await this.rpc.getSelectedChannel();
    if (!channel)
      return this.DeskThingServer.sendError(
        "[Server] Channel could not be fetched"
      );

    await this.unsubscribe();

    // Send channel information to the client for display in the ChannelBanner
    this.selectedChannel = channel;
    this.DeskThingServer.sendLog(
      `Set the selected channel to ${this.selectedChannel.id}`
    );

    await this.hydrateUsers();

    // Subscribe to voice events for the selected channel
    this.subscriptions.voice[this.selectedChannel.id] = [
      await this.rpc.subscribe("VOICE_STATE_UPDATE", {
        channel_id: this.selectedChannel.id,
      }),
      await this.rpc.subscribe("VOICE_STATE_CREATE", {
        channel_id: this.selectedChannel.id,
      }),
      await this.rpc.subscribe("VOICE_STATE_DELETE", {
        channel_id: this.selectedChannel.id,
      }),
      await this.rpc.subscribe("SPEAKING_START", {
        channel_id: this.selectedChannel.id,
      }),
      await this.rpc.subscribe("SPEAKING_STOP", {
        channel_id: this.selectedChannel.id,
      }),
    ];

    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "channel_info",
      request: "channel_banner",
      payload: this.selectedChannel,
    });

    this.DeskThingServer.sendLog(
      `Subscribed to voice events for channel ${this.selectedChannel.id}`
    );
  }

  async hydrateUsers() {
    if (this.selectedChannel.voice_states) {
      for (const voiceState of this.selectedChannel.voice_states) {
        if (voiceState.user) await this.mergeUserData(voiceState.user);
      }
    }
  }

  async clearSelectedChannel() {
    if (!this.selectedChannel) return;
    if (this.subscriptions.voice[this.selectedChannel.id]) {
      this.DeskThingServer.sendLog(
        `Found stale channel ${this.selectedChannel.id}, cleaning up...`
      );
      this.subscriptions.voice[this.selectedChannel.id].forEach((sub) =>
        sub.unsubscribe()
      );
    }

    this.recentChannels.push(this.selectedChannel);
    this.selectedChannel = null;
  }

  async setUserVoiceState() {}

  // Leave the current voice call
  async leaveCall() {
    this.DeskThingServer.sendLog("Attempting to leave call...");
    // @ts-ignore
    this.rpc.selectVoiceChannel(null, { force: true });
    this.DeskThingServer.sendDataToClient({
      app: "discord",
      type: "client_data",
      request: "leave",
    });
    this.clearSelectedChannel();
  }

  getSelectedChannelUsers() {
    if (this.selectedChannel == null)
      throw this.DeskThingServer.sendError(
        "[Server] Can not get connected users because the client is not in a voice channel"
      );
    if (this.cachedUsers.length <= 0)
      throw this.DeskThingServer.sendError(
        "[Server] The user cache is empty, there are no users to return"
      );

    this.DeskThingServer.sendLog(
      "[Server] Attempting to get cached users in the current call"
    );
    return this.cachedUsers.filter((cachedUser) => {
      this.selectedChannel.voice_states.find(
        (state) => state.user.id == cachedUser.id
      );
    });
  }
}

export default DiscordHandler;
