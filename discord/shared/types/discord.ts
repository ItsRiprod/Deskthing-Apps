import { SETTING_TYPES } from "@deskthing/types";

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
    HAVE_TIMER = 'have_timer',
    LEFT_DASHBOARD_PANEL = 'left_dashboard_panel',
    RIGHT_DASHBOARD_PANEL = 'right_dashboard_panel',
    DASHBOARD_ELEMENTS = 'dashboard_elements',
}

export enum PANEL_ELEMENTS {
  CALL_STATUS = 'call_status',
  GUILD_LIST = 'guild_list',
  CHAT = 'chat',
  SONG = 'song',
  BLANK = 'blank'
}
export enum DASHBOARD_ELEMENTS {
  MINI_CALL = 'mini_call',
  CALL_CONTROLS = 'call_controls',
  CLOCK = 'clock',
  NOTIFICATIONS = 'notifications',
  BG_ALBUM = 'bg_album'
}

type StringSetting = {
  id: AppSettingIDs.CLIENT_ID | AppSettingIDs.CLIENT_SECRET | AppSettingIDs.SET_MAIN_TEXT | AppSettingIDs.SET_SECONDARY_TEXT | AppSettingIDs.REDIRECT_URL;
  type: typeof SETTING_TYPES.STRING;
  description: string;
  label: string;
  value: string;
};

type BooleanSetting = {
  id: AppSettingIDs.HAVE_TIMER;
  type: typeof SETTING_TYPES.BOOLEAN;
  description: string;
  label: string;
  value: boolean;
};

type SelectSetting = {
  id: AppSettingIDs.LEFT_DASHBOARD_PANEL | AppSettingIDs.RIGHT_DASHBOARD_PANEL;
  type: typeof SETTING_TYPES.SELECT;
  description: string;
  label: string;
  value: PANEL_ELEMENTS;
  options: { value: PANEL_ELEMENTS; label: string }[];
};

type MultiSelectSetting = {
  id: AppSettingIDs.DASHBOARD_ELEMENTS;
  type: typeof SETTING_TYPES.MULTISELECT;
  description: string;
  label: string;
  value: DASHBOARD_ELEMENTS[];
  options: { value: DASHBOARD_ELEMENTS; label: string }[];
};

export type DiscordSettings = {
  [AppSettingIDs.CLIENT_ID]: StringSetting & { id: AppSettingIDs.CLIENT_ID };
  [AppSettingIDs.CLIENT_SECRET]: StringSetting & { id: AppSettingIDs.CLIENT_SECRET };
  [AppSettingIDs.REDIRECT_URL]: StringSetting & { id: AppSettingIDs.REDIRECT_URL };
  [AppSettingIDs.SET_MAIN_TEXT]: StringSetting & { id: AppSettingIDs.SET_MAIN_TEXT };
  [AppSettingIDs.SET_SECONDARY_TEXT]: StringSetting & { id: AppSettingIDs.SET_SECONDARY_TEXT };
  [AppSettingIDs.HAVE_TIMER]: BooleanSetting;
  [AppSettingIDs.LEFT_DASHBOARD_PANEL]: SelectSetting & { id: AppSettingIDs.LEFT_DASHBOARD_PANEL, value: PANEL_ELEMENTS };
  [AppSettingIDs.RIGHT_DASHBOARD_PANEL]: SelectSetting & { id: AppSettingIDs.RIGHT_DASHBOARD_PANEL, value: PANEL_ELEMENTS };
  [AppSettingIDs.DASHBOARD_ELEMENTS]: MultiSelectSetting & { id: AppSettingIDs.DASHBOARD_ELEMENTS, value: DASHBOARD_ELEMENTS[]  };
};