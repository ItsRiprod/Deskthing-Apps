import { DeskThing } from "@deskthing/server"

export enum ImageType {
    GuildIcon,
    GuildSplash,
    GuildDiscoverySplash,
    GuildBanner,
    UserBanner,
    DefaultUserAvatar,
    UserAvatar,
    GuildMemberAvatar,
    AvatarDecoration,
    ApplicationIcon,
    ApplicationCover,
    ApplicationAsset,
    AchievementIcon,
    StorePageAsset,
    StickerPackBanner,
    TeamIcon,
    Sticker,
    RoleIcon,
    GuildScheduledEventCover,
    GuildMemberBanner,
    CustomEmoji
}

export const getImageFromHash = (imageHash: string, imageType: ImageType, id?: string,  options?: {
    size?: number,
    ext?: string
}): string => {
    const size = options?.size ? `?size=${options.size}` : ''
    const ext = options?.ext ? `.${options.ext}` : '.png'

    switch (imageType) {
        case ImageType.GuildIcon:
            return `https://cdn.discordapp.com/icons/${id}/${imageHash}${ext}${size}`
        case ImageType.GuildSplash:
            return `https://cdn.discordapp.com/splashes/${id}/${imageHash}${ext}${size}`
        case ImageType.GuildDiscoverySplash:
            return `https://cdn.discordapp.com/discovery-splashes/${id}/${imageHash}${ext}${size}`
        case ImageType.GuildBanner:
            return `https://cdn.discordapp.com/banners/${id}/${imageHash}${ext}${size}`
        case ImageType.UserBanner:
            return `https://cdn.discordapp.com/banners/${id}/${imageHash}${ext}${size}`
        case ImageType.DefaultUserAvatar:
            return `https://cdn.discordapp.com/embed/avatars/${Number(id) % 5}${ext}${size}`
        case ImageType.UserAvatar:
            return `https://cdn.discordapp.com/avatars/${id}/${imageHash}${ext}${size}`
        case ImageType.GuildMemberAvatar:
            return `https://cdn.discordapp.com/guilds/${id}/users/${id}/avatars/${imageHash}${ext}${size}`
        case ImageType.AvatarDecoration:
            return `https://cdn.discordapp.com/avatar-decoration-presets/${imageHash}${ext}${size}`
        case ImageType.ApplicationIcon:
            return `https://cdn.discordapp.com/app-icons/${id}/${imageHash}${ext}${size}`
        case ImageType.ApplicationCover:
            return `https://cdn.discordapp.com/app-icons/${id}/${imageHash}${ext}${size}`
        case ImageType.ApplicationAsset:
            return `https://cdn.discordapp.com/app-assets/${id}/${imageHash}${ext}${size}`
        case ImageType.AchievementIcon:
            return `https://cdn.discordapp.com/app-assets/${id}/achievements/${id}/icons/${imageHash}${ext}${size}`
        case ImageType.StorePageAsset:
            return `https://cdn.discordapp.com/app-assets/${id}/${imageHash}${ext}${size}`
        case ImageType.StickerPackBanner:
            return `https://cdn.discordapp.com/app-assets/710982414301790216/store/${imageHash}${ext}${size}`
        case ImageType.TeamIcon:
            return `https://cdn.discordapp.com/team-icons/${id}/${imageHash}${ext}${size}`
        case ImageType.Sticker:
            return `https://cdn.discordapp.com/stickers/${id}${ext}${size}`
        case ImageType.RoleIcon:
            return `https://cdn.discordapp.com/role-icons/${id}/${imageHash}${ext}${size}`
        case ImageType.GuildScheduledEventCover:
            return `https://cdn.discordapp.com/guild-events/${id}/${imageHash}${ext}${size}`
        case ImageType.GuildMemberBanner:
            return `https://cdn.discordapp.com/guilds/${id}/users/${id}/banners/${imageHash}${ext}${size}`
        case ImageType.CustomEmoji:
            return `https://cdn.discordapp.com/emojis/${id}${ext}${size}`
        default:
            return ''
    }
}

export const getEncodedImage = async (imageHash?: string | null, imageType?: ImageType, id?: string,  options?: {
    size?: number,
    ext?: string
}): Promise<string | undefined> => {
    if (!imageHash || !imageType) return undefined
    const imageUrl = getImageFromHash(imageHash, imageType, id, options)
    return await getEncodedImageURL(imageUrl)
}

export const getEncodedImageURL = async (imageUrl: string) => {
    if (!imageUrl) return undefined
    return imageUrl
}
