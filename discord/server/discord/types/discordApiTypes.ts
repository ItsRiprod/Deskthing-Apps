import { ChannelTypes } from "discord-interactions"

export enum RPCCommands {
  /** event dispatch */
  DISPATCH = "DISPATCH",
  /** used to authorize a new client with your app */
  AUTHORIZE = "AUTHORIZE",
  /** used to authenticate an existing client with your app */
  AUTHENTICATE = "AUTHENTICATE",
  /** used to retrieve guild information from the client */
  GET_GUILD = "GET_GUILD",
  /** used to retrieve a list of guilds from the client */
  GET_GUILDS = "GET_GUILDS",
  /** used to retrieve channel information from the client */
  GET_CHANNEL = "GET_CHANNEL",
  /** used to retrieve a list of channels for a guild from the client */
  GET_CHANNELS = "GET_CHANNELS",
  /** used to subscribe to an RPC event */
  SUBSCRIBE = "SUBSCRIBE",
  /** used to unsubscribe from an RPC event */
  UNSUBSCRIBE = "UNSUBSCRIBE",
  /** used to change voice settings of users in voice channels */
  SET_USER_VOICE_SETTINGS = "SET_USER_VOICE_SETTINGS",
  /** used to join or leave a voice channel, group dm, or dm */
  SELECT_VOICE_CHANNEL = "SELECT_VOICE_CHANNEL",
  /** used to get the current voice channel the client is in */
  GET_SELECTED_VOICE_CHANNEL = "GET_SELECTED_VOICE_CHANNEL",
  /** used to join or leave a text channel, group dm, or dm */
  SELECT_TEXT_CHANNEL = "SELECT_TEXT_CHANNEL",
  /** used to retrieve the client's voice settings */
  GET_VOICE_SETTINGS = "GET_VOICE_SETTINGS",
  /** used to set the client's voice settings */
  SET_VOICE_SETTINGS = "SET_VOICE_SETTINGS",
  /** used to send info about certified hardware devices */
  SET_CERTIFIED_DEVICES = "SET_CERTIFIED_DEVICES",
  /** used to update a user's Rich Presence */
  SET_ACTIVITY = "SET_ACTIVITY",
  /** used to consent to a Rich Presence Ask to Join request */
  SEND_ACTIVITY_JOIN_INVITE = "SEND_ACTIVITY_JOIN_INVITE",
  /** used to reject a Rich Presence Ask to Join request */
  CLOSE_ACTIVITY_REQUEST = "CLOSE_ACTIVITY_REQUEST",
}

export enum RPCEvents {
  /** non-subscription event sent immediately after connecting, contains server information */
  READY = "READY",
  /** non-subscription event sent when there is an error, including command responses */
  ERROR = "ERROR",
  /** sent when a subscribed server's state changes */
  GUILD_STATUS = "GUILD_STATUS",
  /** sent when a guild is created/joined on the client */
  GUILD_CREATE = "GUILD_CREATE",
  /** sent when a channel is created/joined on the client */
  CHANNEL_CREATE = "CHANNEL_CREATE",
  /** sent when the client joins a voice channel */
  VOICE_CHANNEL_SELECT = "VOICE_CHANNEL_SELECT",
  /** sent when a user joins a subscribed voice channel */
  VOICE_STATE_CREATE = "VOICE_STATE_CREATE",
  /** sent when a user's voice state changes in a subscribed voice channel */
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  /** sent when a user parts a subscribed voice channel */
  VOICE_STATE_DELETE = "VOICE_STATE_DELETE",
  /** sent when the client's voice settings update */
  VOICE_SETTINGS_UPDATE = "VOICE_SETTINGS_UPDATE",
  /** sent when the client's voice connection status changes */
  VOICE_CONNECTION_STATUS = "VOICE_CONNECTION_STATUS",
  /** sent when a user in a subscribed voice channel speaks */
  SPEAKING_START = "SPEAKING_START",
  /** sent when a user in a subscribed voice channel stops speaking */
  SPEAKING_STOP = "SPEAKING_STOP",
  /** sent when a message is created in a subscribed text channel */
  MESSAGE_CREATE = "MESSAGE_CREATE",
  /** sent when a message is updated in a subscribed text channel */
  MESSAGE_UPDATE = "MESSAGE_UPDATE",
  /** sent when a message is deleted in a subscribed text channel */
  MESSAGE_DELETE = "MESSAGE_DELETE",
  /** sent when the client receives a notification */
  NOTIFICATION_CREATE = "NOTIFICATION_CREATE",
  /** sent when the user clicks a Rich Presence join invite in chat to join a game */
  ACTIVITY_JOIN = "ACTIVITY_JOIN",
  /** sent when the user clicks a Rich Presence spectate invite in chat to spectate a game */
  ACTIVITY_SPECTATE = "ACTIVITY_SPECTATE",
  /** sent when the user receives a Rich Presence Ask to Join request */
  ACTIVITY_JOIN_REQUEST = "ACTIVITY_JOIN_REQUEST",
}

export type Channel = {
  id: string;
  name: string;
  /**
   * Guild text: 0, Guild voice: 2, DM: 1, Group DM: 3
   */
  type: ChannelTypes;
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
  /**
   * (text)
   */
  position?: number | undefined;
  /**
   * (voice) https://discordapp.com/developers/docs/resources/voice#voice-state-object
   */
  voice_states?: VoiceStateCreate[] | undefined;
  /**
   * (text) https://discordapp.com/developers/docs/resources/channel#message-object
   */
  messages?: MessageObject[] | undefined;
};

export interface MessageObject {
  /** id of the message */
  id: string;
  /** id of the channel the message was sent in */
  channel_id: string;
  /** the author of this message (not guaranteed to be a valid user, see below) */
  author: User; // Replace 'any' with User type if you have it
  /** contents of the message */
  content: string;
  /** when this message was sent */
  timestamp: string;
  /** when this message was edited (or null if never) */
  edited_timestamp: string | null;
  /** whether this was a TTS message */
  tts: boolean;
  /** whether this message mentions everyone */
  mention_everyone: boolean;
  /** users specifically mentioned in the message */
  mentions: User[]; // Replace 'any' with User type if you have it
  /** roles specifically mentioned in this message */
  mention_roles: string[];
  /** channels specifically mentioned in this message */
  mention_channels?: ChannelMention[]; // Replace 'any' with ChannelMention type if you have it
  /** any attached files */
  attachments: Attachment[]; // Replace 'any' with Attachment type if you have it
  /** any embedded content */
  embeds: Embed[]; // Replace 'any' with Embed type if you have it
  /** reactions to the message */
  reactions?: Reaction[]; // Replace 'any' with Reaction type if you have it
  /** used for validating a message was sent */
  nonce?: number | string;
  /** whether this message is pinned */
  pinned: boolean;
  /** if the message is generated by a webhook, this is the webhook's id */
  webhook_id?: string;
  /** type of message */
  type: MessageType;
  /** sent with Rich Presence-related chat embeds */
  activity?: MessageActivity; // Replace 'any' with MessageActivity type if you have it
  /** sent with Rich Presence-related chat embeds */
  application?: PartialApplication; // Replace 'any' with PartialApplication type if you have it
  /** if the message is an Interaction or application-owned webhook, this is the id of the application */
  application_id?: string;
  /** message flags combined as a bitfield */
  flags?: MessageFlags;
  /** data showing the source of a crosspost, channel follow add, pin, or reply message */
  message_reference?: MessageReference; // Replace 'any' with MessageReference type if you have it
  /** the message associated with the message_reference. This is a minimal subset of fields in a message (e.g. author is excluded.) */
  message_snapshots?: MessageSnapshot[];
  /** the message associated with the message_reference */
  referenced_message?: MessageObject | null;
  /** Sent if the message is sent as a result of an interaction */
  interaction_metadata?: MessageInteractionMetadata; // Replace with MessageInteractionMetadata
  /** Deprecated in favor of interaction_metadata; sent if the message is a response to an interaction */
  interaction?: MessageInteraction; // Replace 'any' with MessageInteraction type if you have it
  /** the thread that was started from this message, includes thread member object */
  thread?: Channel; // Replace 'any' with Channel type if you have it and it represents a thread
  /** sent if the message contains components like buttons, action rows, or other interactive components */
  components?: MessageComponent[]; // Replace 'any' with MessageComponent type if you have it
  /** sent if the message contains stickers */
  sticker_items?: MessageStickerItem[]; // Replace 'any' with MessageStickerItem type if you have it
  /** Deprecated the stickers sent with the message */
  stickers?: Sticker[]; // Replace 'any' with Sticker type if you have it
  /** A generally increasing integer (there may be gaps or duplicates) that represents the approximate position of the message in a thread, it can be used to estimate the relative position of the message in a thread in company with total_message_sent on parent thread */
  position?: number;
  /** data of the role subscription purchase or renewal that prompted this ROLE_SUBSCRIPTION_PURCHASE message */
  role_subscription_data?: RoleSubscriptionData; // Replace 'any' with RoleSubscriptionData type if available
  /** data for users, members, channels, and roles in the message's auto-populated select menus */
  resolved?: ResolvedData; // Replace 'any' with ResolvedData type if you have it
  /** A poll! */
  poll?: Poll; //Replace 'any' with Poll type if you have it
  /** the call associated with the message */
  call?: MessageCall; // Replace 'any' with MessageCall type if you have it
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface ChannelMention {
  id: string;
  guild_id: string;
  type: ChannelTypes; // Assuming you have a ChannelType enum
  name: string;
}

export interface Attachment {
  id: string;
  filename: string;
  description?: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number | null;
  width?: number | null;
  ephemeral?: boolean;
}

export interface Embed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  video?: EmbedVideo;
  provider?: EmbedProvider;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedImage {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedThumbnail {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedVideo {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedProvider {
  name?: string;
  url?: string;
}

export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Reaction {
  count: number;
  me: boolean;
  emoji: Emoji; // Assuming you have an Emoji type
}

export interface Emoji {
  id: string | null;
  name: string | null;
  roles?: string[];
  user?: User;
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
}

export interface MessageActivity {
  type: MessageActivityType;
  party_id?: string;
}

export const enum MessageActivityType {
  JOIN = 1,
  SPECTATE = 2,
  LISTEN = 3,
  JOIN_REQUEST = 5,
}

export interface PartialApplication {
  id: string;
  flags: number;
}

export interface MessageReference {
  message_id?: string;
  channel_id: string;
  guild_id?: string;
}

export interface MessageSnapshot {
  id: string;
  channel_id: string;
  // Other minimal fields, excluding author
}

export interface MessageInteractionMetadata {
  id: string;
  type: number; // Assuming InteractionType
  name: string;
  user: User;
  member?: any; // TODO: Replace with GuildMember
}

export interface MessageInteraction {
  id: string;
  type: number;
  name: string;
  user: User;
}

export interface MessageCreate {
  channel_id: string;
  message: {
    id: string;
    blocked: boolean;
    content: string;
    content_parsed: Array<{
      content: string;
      type: string;
    }>;
    author_color: string;
    edited_timestamp: string | null;
    timestamp: string;
    tts: boolean;
    mentions: Array<any>;
    mention_roles: Array<any>;
    mention_everyone: boolean;
    embeds: Array<any>;
    attachments: Array<any>;
    type: MessageType;
    pinned: boolean;
    author: {
      id: string;
      username: string;
      discriminator: string;
      avatar: string;
      bot: boolean;
    };
  };
}


export interface MessageComponent {}

export interface MessageStickerItem {
  id: string;
  name: string;
  format_type: number; // Assuming StickerFormatType
}

export interface Sticker {}

export interface RoleSubscriptionData {}

export interface ResolvedData {}

export interface Poll {}

export interface MessageCall {}

export const enum MessageType {
  DEFAULT = 0,
  RECIPIENT_ADD = 1,
  RECIPIENT_REMOVE = 2,
  CALL = 3,
  CHANNEL_NAME_CHANGE = 4,
  CHANNEL_ICON_CHANGE = 5,
  CHANNEL_PINNED_MESSAGE = 6,
  USER_JOIN = 7,
  GUILD_BOOST = 8,
  GUILD_BOOST_TIER_1 = 9,
  GUILD_BOOST_TIER_2 = 10,
  GUILD_BOOST_TIER_3 = 11,
  CHANNEL_FOLLOW_ADD = 12,
  GUILD_DISCOVERY_DISQUALIFIED = 14,
  GUILD_DISCOVERY_REQUALIFIED = 15,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING = 16,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING = 17,
  THREAD_CREATED = 18,
  REPLY = 19,
  CHAT_INPUT_COMMAND = 20,
  THREAD_STARTER_MESSAGE = 21,
  GUILD_INVITE_REMINDER = 22,
  CONTEXT_MENU_COMMAND = 23,
  AUTO_MODERATION_ACTION = 24,
  ROLE_SUBSCRIPTION_PURCHASE = 25,
  INTERACTION_PREMIUM_UPSELL = 26,
  STAGE_START = 27,
  STAGE_END = 28,
  STAGE_SPEAKER = 29,
  STAGE_TOPIC = 31,
  GUILD_APPLICATION_PREMIUM_SUBSCRIPTION = 32,
  GUILD_INCIDENT_ALERT_MODE_ENABLED = 36,
  GUILD_INCIDENT_ALERT_MODE_DISABLED = 37,
  GUILD_INCIDENT_REPORT_RAID = 38,
  GUILD_INCIDENT_REPORT_FALSE_ALARM = 39,
  PURCHASE_NOTIFICATION = 44,
  POLL_RESULT = 46,
}

export enum MessageFlags {
  CROSSPOSTED = 1 << 0,
  IS_CROSSPOST = 1 << 1,
  SUPPRESS_EMBEDS = 1 << 2,
  SOURCE_MESSAGE_DELETED = 1 << 3,
  URGENT = 1 << 4,
  HAS_THREAD = 1 << 5,
  EPHEMERAL = 1 << 6,
  LOADING = 1 << 7,
  FAILED_TO_MENTION_SOME_ROLES_IN_THREAD = 1 << 8,
  SUPPRESS_NOTIFICATIONS = 1 << 12,
  IS_VOICE_MESSAGE = 1 << 13,
  HAS_SNAPSHOT = 1 << 14,
}

export interface VoiceConnectionStatus {
  state: VoiceConnectionStates;
  hostname: string;
  pings: number[];
  average_ping: number;
  last_ping: number;
}

export const enum VoiceConnectionStates {
  DISCONNECTED = "DISCONNECTED",
  AWAITING_ENDPOINT = "AWAITING_ENDPOINT",
  AUTHENTICATING = "AUTHENTICATING",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  VOICE_DISCONNECTED = "VOICE_DISCONNECTED",
  VOICE_CONNECTING = "VOICE_CONNECTING",
  VOICE_CONNECTED = "VOICE_CONNECTED",
  NO_ROUTE = "NO_ROUTE",
  ICE_CHECKING = "ICE_CHECKING",
}

export interface VoiceStateCreate {
  voice_state: {
    mute: boolean;
    deaf: boolean;
    self_mute: boolean;
    self_deaf: boolean;
    suppress: boolean;
  };
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot: boolean;
  };
  nick: string;
  volume: number;
  mute: boolean;
  pan: {
    left: number;
    right: number;
  };
}

export interface VoiceStateObject {
  guild_id?: string;
  channel_id?: string;
  user_id: string;
  member?: GuildMemberObject;
  session_id: string;
  deaf: boolean;
  mute: boolean;
  self_deaf: boolean;
  self_mute: boolean;
  self_stream?: boolean;
  self_video: boolean;
  suppress: boolean;
  request_to_speak_timestamp?: string;
}

export interface GuildMemberObject {
  user?: User;
  nick?: string | null;
  avatar?: string | null;
  banner?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
  flags: number;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: string | null;
  avatar_decoration_data?: AvatarDecorationDataObject;
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
  avatar_decoration_data?: AvatarDecorationDataObject;
}

export interface AvatarDecorationDataObject {
  asset: string;
  sku_id: string;
}

export interface NotificationCreate {
  channel_id: string;
  message: MessageObject;
  icon_url: string;
  title: string;
  body: string;
}

export interface RoleTags {
  bot_id?: string;
  integration_id?: string;
  premium_subscriber?: null;
  subscription_listing_id?: string;
  available_for_purchase?: null;
  guild_connections?: null;
}

export interface Role {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  icon?: string;
  unicode_emoji?: string;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  tags?: RoleTags;
  flags: number;
}

export interface WelcomeScreenChannel {
  channel_id: string;
  description: string;
  emoji_id?: string;
  emoji_name?: string;
}

export interface WelcomeScreen {
  description?: string;
  welcome_channels: WelcomeScreenChannel[];
}

  export interface GetGuildsData {
    guilds: Array<GetGuildData>
  }

  export interface GetGuildData {
    id: string
    name: string
    icon_url: string | null
  }

  export interface GetChannelsData {
    channels: Channel[]
  }

  export interface GetGuildResponse {
    cmd: 'GET_GUILD'
    data: GetGuildData
    nonce: string
  }

  export interface Guild {
    id: string
    name: string
    icon?: string
    icon_hash?: string
    splash?: string
    discovery_splash?: string
    owner?: boolean
    owner_id?: string
    permissions?: string
    region?: string
    afk_channel_id?: string
    afk_timeout?: number
    widget_enabled?: boolean
    widget_channel_id?: string
    verification_level?: number
    default_message_notifications?: number
    explicit_content_filter?: number
    roles?: Role[]
    emojis?: Emoji[]
    features?: string[]
    mfa_level?: number
    application_id?: string
    system_channel_id?: string
    system_channel_flags?: number
    rules_channel_id?: string
    max_presences?: number
    max_members?: number
    vanity_url_code?: string
    description?: string
    banner?: string
    premium_tier?: number
    premium_subscription_count?: number
    preferred_locale?: string
    public_updates_channel_id?: string
    max_video_channel_users?: number
    max_stage_video_channel_users?: number
    approximate_member_count?: number
    approximate_presence_count?: number
    welcome_screen?: WelcomeScreen
    nsfw_level?: number
    stickers?: Sticker[]
    premium_progress_bar_enabled?: boolean
    safety_alerts_channel_id?: string

    /**
     * Added progmatically by DeskThing - not retrieved by the Discord API
     */
    channels: Channel[]
  }