export interface CallStatus {
  channelId: string | null;
  participants: CallParticipant[];
  isConnected: boolean;
  timestamp: number;
  user?: CallParticipant;
  channel?: {
    id: string;
    name: string;
    /**
     * Guild text: 0, Guild voice: 2, DM: 1, Group DM: 3
     */
    type: number;
    guild_id?: string | undefined;
    /**
     * (text)
     */
    topic?: string | undefined;
    /**
     * (voice)
     */
    bitrate?: number | undefined;
    /**
     * (voice) 0 if none
     */
    user_limit?: number | undefined;
  };
}

export interface CallParticipant {
  id: string;
  profileUrl?: string;
  username: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    profileUrl?: string;
  };
  timestamp: number;
}

export interface ChatStatus {
  isLoading?: boolean;
  currentChannelId: string | null;
  messages: ChatMessage[];
  typingUsers: string[];
}

export interface NotificationStatus {
  notifications: Notification[];
}
export interface Notification {
  id: string;
  title: string
  channelId: string;
  author: {
    id: string;
    username: string;
    profileUrl?: string;
  };
  content: string;
  timestamp: number;
  read: boolean;
}

export interface GuildStatus {
  id: string;
  name: string;
  icon?: string;
}

export interface ChannelStatus {
  id: string;
  name: string;
  type: number;
  guild_id?: string;
}

export interface GuildListStatus {
  selectedGuildId: string | null;
  guilds: GuildStatus[];
  textChannels: ChannelStatus[];
}

export type DMListStatus = {
  selectedDMId: string | null
  dms: DMStatus[]
  channels: ChannelStatus[]
}

export type DMStatus = {
  id: string
}

export enum DISCORD_ACTIONS {
  MUTE = 'mute',
  DEAFEN = 'deafen',
  DISCONNECT = 'disconnect',
  REAUTH = 'reauth',
  REPRESENCE = 'represence',
  EXPAND_CHAT = 'expandChat',
  COLLAPSE_CHAT = 'collapseChat',
  SELECT_TEXT_CHANNEL = 'selectTextChannel',
  MARK_NOTIFICATION_AS_READ = 'markNotificationAsRead',
  MARK_ALL_NOTIFICATIONS_AS_READ = 'markAllNotificationsAsRead',
}

export enum AppSettingIDs {
    CLIENT_ID = 'client_id',
    CLIENT_SECRET = 'client_secret',
    REDIRECT_URL = 'redirect_url',
    SET_MAIN_TEXT = 'set_main_text',
    SET_SECONDARY_TEXT = 'set_secondary_text',
    HAVE_TIMER = 'have_timer'
}