import { CallStatus, ChannelStatus, ChatStatus, GuildListStatus, Notification, NotificationStatus } from "./discord"

export type ToServerTypes =
 | { type: DiscordEvents.GET, request: 'call', payload?: string }
 | { type: DiscordEvents.GET, request: 'chat', payload?: string }
 | { type: DiscordEvents.GET, request: 'notification', payload?: string }
 | { type: DiscordEvents.GET, request: 'guildList', payload?: string }
 | { type: DiscordEvents.GET, request: 'refreshGuildList', payload?: string }
 | { type: DiscordEvents.SET, request: 'guild', payload: { guildId: string } }
 | { type: DiscordEvents.SET, request: 'channel', payload: { channelId: string } }

export enum DiscordEvents {
    CALL = 'call',
    CHAT = 'chat',
    GET = 'get',
    SET = 'SET',
    NOTIFICATION = 'notification',
    GUILD_LIST = 'guildList',
    CHANNELS = 'channels'
}

export type ToClientTypes = 
 | { type: DiscordEvents.CALL, request: 'set', payload: CallStatus }
 | { type: DiscordEvents.CALL, request: 'update', payload: { userId: string; isSpeaking: boolean; } }
 | { type: DiscordEvents.CHAT, request: 'set', payload: ChatStatus }
 | { type: DiscordEvents.NOTIFICATION, request: 'set', payload: NotificationStatus }
 | { type: DiscordEvents.NOTIFICATION, request: 'add', payload: { notification: Notification } }
 | { type: DiscordEvents.NOTIFICATION, request: 'read', payload: { notificationId: string } }
 | { type: DiscordEvents.GUILD_LIST, request: 'set', payload: GuildListStatus }
 | { type: DiscordEvents.CHANNELS, request: 'set', payload: { channels: ChannelStatus[] } }