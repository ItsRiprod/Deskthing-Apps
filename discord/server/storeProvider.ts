
import { DeskThing } from "@deskthing/server";
import { DiscordRPCStore } from "./discord/stores/rpcStore";
import { DiscordAuth } from "./discord/api/auth";
import { TokenStorage } from "./discord/utils/tokenStorage";
import { CallControls } from "./discord/stores/controlsStore";
import { CallStatusManager } from "./discord/stores/callStore";
import { ChatStatusManager } from "./discord/stores/chatStore";
import { GuildListManager } from "./discord/stores/guildStore";
import { NotificationStatusManager } from "./discord/stores/notificationStore";
import { RichPresence } from "./discord/stores/presenceStore";
import { DeskthingStore } from "./discord/stores/deskthingStore"

export class StoreProvider {
  private static instance: StoreProvider | null;
  private rpc: DiscordRPCStore;
  private tokenStorage: TokenStorage;
  private auth: DiscordAuth;
  private callControls: CallControls;
  private callStatus: CallStatusManager;
  private chatStatus: ChatStatusManager;
  private guildList: GuildListManager;
  private notificationStatus: NotificationStatusManager;
  private richPresence: RichPresence;
  private deskthingStore: DeskthingStore

  private constructor() {
    this.rpc = new DiscordRPCStore();
    this.tokenStorage = new TokenStorage();
    this.auth = new DiscordAuth(this.rpc, this.tokenStorage);
    this.callControls = new CallControls(this.rpc);
    this.callStatus = new CallStatusManager(this.rpc);
    this.chatStatus = new ChatStatusManager(this.rpc);
    this.guildList = new GuildListManager(this.rpc);
    this.notificationStatus = new NotificationStatusManager(this.rpc);
    this.richPresence = new RichPresence(this.rpc);
    this.deskthingStore = new DeskthingStore(this.callStatus, this.chatStatus, this.guildList, this.notificationStatus);
  }

  public static getInstance(): StoreProvider {
    if (!StoreProvider.instance) {
      StoreProvider.instance = new StoreProvider();
    }
    return StoreProvider.instance;
  }

  public getRPC(): DiscordRPCStore {
    return this.rpc;
  }

  public getAuth(): DiscordAuth {
    return this.auth;
  }

  public getCallControls(): CallControls {
    return this.callControls;
  }

  public getCallStatus(): CallStatusManager {
    return this.callStatus;
  }

  public getChatStatus(): ChatStatusManager {
    return this.chatStatus;
  }

  public getGuildList(): GuildListManager {
    return this.guildList;
  }

  public getNotificationStatus(): NotificationStatusManager {
    return this.notificationStatus;
  }

  public getRichPresence(): RichPresence {
    return this.richPresence;
  }

  public getTokenStorage(): TokenStorage {
    return this.tokenStorage;
  }

  public async initialize(): Promise<void> {
    try {
      DeskThing.sendLog("Initializing Store Provider...");
    } catch (error) {
      DeskThing.sendError(`Failed to initialize Store Provider: ${error}`);
      throw error;
    }
  }

  public dispose(): void {
    // Cleanup logic
    this.rpc.removeAllListeners();
    StoreProvider.instance = null;
    DeskThing.sendLog("Store Provider disposed");
  }
}

export default StoreProvider.getInstance();
