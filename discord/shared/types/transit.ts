import { CallStatus, ChannelStatus, ChatStatus, DiscordSettings, GuildListStatus, Notification, NotificationStatus } from "./discord"

export type ToServerTypes =
    | { type: DiscordEvents.GET, request: 'call', payload?: string }
    | { type: DiscordEvents.GET, request: 'chat', payload?: string }
    | { type: DiscordEvents.GET, request: 'notification', payload?: string }
    | { type: DiscordEvents.GET, request: 'guildList', payload?: string }
    | { type: DiscordEvents.GET, request: 'refreshGuildList', payload?: string }
    | { type: DiscordEvents.SET, request: 'guild', payload: { guildId: string } }
    | { type: DiscordEvents.SET, request: 'channel', payload: { channelId: string } }
    | { type: DiscordEvents.SET, request: 'notificationToasts', payload: { enabled: boolean } }
    | { type: DiscordEvents.SET, request: 'notificationRead', payload: { notificationId: string } }
    | { type: DiscordEvents.SET, request: 'notificationsReadAll' }
    | { type: DiscordEvents.GET, request: 'settings', clientId?: string }

export enum DiscordEvents {
    CALL = 'call',
    VOICE_STATE = 'voiceState',
    CHAT = 'chat',
    GET = 'discord-get',
    SET = 'discord-set',
    NOTIFICATION = 'notification',
    GUILD_LIST = 'guildList',
    CHANNELS = 'channels',
    SETTINGS = 'discord-settings',
}

export type ToClientTypes =
    | { type: DiscordEvents.CALL, request: 'set', payload: CallStatus }
    | {
        type: DiscordEvents.VOICE_STATE, request: 'update', payload: {
            isMuted: boolean;
            isDeafened: boolean;
        }
    }
    | { type: DiscordEvents.CALL, request: 'update', payload: { userId: string; isSpeaking: boolean; } }
    | { type: DiscordEvents.CHAT, request: 'set', payload: ChatStatus }
    | { type: DiscordEvents.NOTIFICATION, request: 'set', payload: NotificationStatus }
    | { type: DiscordEvents.NOTIFICATION, request: 'add', payload: { notification: Notification } }
    | { type: DiscordEvents.NOTIFICATION, request: 'read', payload: { notificationId: string } }
    | { type: DiscordEvents.GUILD_LIST, request: 'set', payload: GuildListStatus }
    | { type: DiscordEvents.CHANNELS, request: 'set', payload: { channels: ChannelStatus[] } }
    | { type: DiscordEvents.SETTINGS, request: 'set', payload: DiscordSettings }
