import { SETTING_TYPES, SettingsBoolean, SettingsColor, SettingsMultiSelect, SettingsRanked, SettingsSelect, SettingsString } from "@deskthing/types";

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
    RICH_PRESENCE = 'rich_presence',
    SET_MAIN_TEXT = 'set_main_text',
    SET_SECONDARY_TEXT = 'set_secondary_text',
    HAVE_TIMER = 'have_timer',
    LEFT_DASHBOARD_PANEL = 'left_dashboard_panel',
    RIGHT_DASHBOARD_PANEL = 'right_dashboard_panel',
    DASHBOARD_ELEMENTS = 'dashboard_elements',
    SCROLL_TO_BOTTOM = 'scroll_to_bottom',
    NOTIFICATION_TOASTS = 'notification_toasts',
    CONTROLS_ORDER = 'controls_order',
    SPEAKING_COLOR = 'speaking_color',
    CLOCK_OPTIONS = 'clock_options',
    SONG_OPTIONS = 'song_options'
}

export enum PANEL_ELEMENTS {
  CALL_STATUS = 'call_status',
  GUILD_LIST = 'guild_list',
  CHAT = 'chat',
  SONG = 'song',
  CLOCK = 'clock',
  BLANK = 'blank'
}

export enum DASHBOARD_ELEMENTS {
  MINI_CALL = 'mini_call',
  CALL_CONTROLS = 'call_controls',
  NOTIFICATIONS = 'notifications',
  BG_ALBUM = 'bg_album'
}

export enum CONTROL_OPTIONS {
  MUTE = 'mute',
  DEAFEN = 'deafen',
  DISCONNECT = 'disconnect'
}

export enum CLOCK_OPTIONS {
  TOP_LEFT = 'top_left',
  TOP_RIGHT = 'top_right',
  TOP_CENTER = 'top_center',
  CUSTOM = 'custom',
  DISABLED = 'disabled'
}

export enum SONG_CONTROLS {
  DISABLED = 'disabled',
  FREE = 'free',
  TOP = 'top',
  BOTTOM = 'bottom',
}

type SelectSetting = SettingsSelect & {
  id: AppSettingIDs.LEFT_DASHBOARD_PANEL | AppSettingIDs.RIGHT_DASHBOARD_PANEL;
  type: typeof SETTING_TYPES.SELECT;
  value: PANEL_ELEMENTS;
  options: { value: PANEL_ELEMENTS; label: string }[];
};

type MultiSelectSetting = SettingsMultiSelect & {
  id: AppSettingIDs.DASHBOARD_ELEMENTS;
  value: DASHBOARD_ELEMENTS[];
  options: { value: DASHBOARD_ELEMENTS; label: string }[];
};

type SelectClockOptions = SettingsSelect & {
  id: AppSettingIDs.CLOCK_OPTIONS;
  value: CLOCK_OPTIONS;
  options: { value: CLOCK_OPTIONS; label: string }[];
}

type SelectSongOptions = SettingsSelect & {
  id: AppSettingIDs.SONG_OPTIONS;
  value: SONG_CONTROLS;
  options: { value: SONG_CONTROLS; label: string }[];
}

type OrderSettings = SettingsRanked & {
  id: AppSettingIDs.CONTROLS_ORDER;
  value: CONTROL_OPTIONS[];
  options: { value: CONTROL_OPTIONS; label: string }[];
};

export type DiscordSettings = {
  [AppSettingIDs.CLIENT_ID]: SettingsString & { id: AppSettingIDs.CLIENT_ID };
  [AppSettingIDs.CLIENT_SECRET]: SettingsString & { id: AppSettingIDs.CLIENT_SECRET };
  [AppSettingIDs.REDIRECT_URL]: SettingsString & { id: AppSettingIDs.REDIRECT_URL };
  // [AppSettingIDs.RICH_PRESENCE]: SettingsBoolean & { id: AppSettingIDs.RICH_PRESENCE };
  // [AppSettingIDs.SET_MAIN_TEXT]: SettingsString & { id: AppSettingIDs.SET_MAIN_TEXT };
  // [AppSettingIDs.SET_SECONDARY_TEXT]: SettingsString & { id: AppSettingIDs.SET_SECONDARY_TEXT };
  // [AppSettingIDs.HAVE_TIMER]: SettingsBoolean & { id: AppSettingIDs.HAVE_TIMER };
  [AppSettingIDs.LEFT_DASHBOARD_PANEL]: SelectSetting & { id: AppSettingIDs.LEFT_DASHBOARD_PANEL, value: PANEL_ELEMENTS };
  [AppSettingIDs.RIGHT_DASHBOARD_PANEL]: SelectSetting & { id: AppSettingIDs.RIGHT_DASHBOARD_PANEL, value: PANEL_ELEMENTS };
  [AppSettingIDs.DASHBOARD_ELEMENTS]: MultiSelectSetting & { id: AppSettingIDs.DASHBOARD_ELEMENTS, value: DASHBOARD_ELEMENTS[]  };
  [AppSettingIDs.SCROLL_TO_BOTTOM]: SettingsBoolean & { id: AppSettingIDs.SCROLL_TO_BOTTOM };
  [AppSettingIDs.NOTIFICATION_TOASTS]: SettingsBoolean & { id: AppSettingIDs.NOTIFICATION_TOASTS };
  [AppSettingIDs.CONTROLS_ORDER]: OrderSettings & { id: AppSettingIDs.CONTROLS_ORDER };
  [AppSettingIDs.SPEAKING_COLOR]: SettingsColor & { id: AppSettingIDs.SPEAKING_COLOR };
  [AppSettingIDs.CLOCK_OPTIONS]: SelectClockOptions & { id: AppSettingIDs.CLOCK_OPTIONS };
  [AppSettingIDs.SONG_OPTIONS]: SelectSongOptions & { id: AppSettingIDs.SONG_OPTIONS };
};