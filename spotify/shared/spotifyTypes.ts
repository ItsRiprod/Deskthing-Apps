export type Playlist = {
  title: string
  owner: string
  tracks: number
  id: string
  uri: string
  index: number
  snapshot_id: string
  thumbnail_url: string | undefined
}

export interface Device {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
  supports_volume: boolean;
}

export type AbbreviatedSong = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  thumbnail: string | undefined | null
}

export type SongQueue = {
  queue: AbbreviatedSong[];
  currently_playing: AbbreviatedSong | null
}

export enum DISPLAY_ITEMS {
  THUMBNAIL = 'thumbnail',
  ALBUM = 'album',
  TITLE = 'title',
  ARTISTS = 'artists',
  CLOCK = 'clock',
  MINI_CLOCK = 'mini_clock',
  CONTROLS = 'controls',
  BACKDROP = 'backdrop',
}

export enum CONTROL_OPTIONS {
  DISABLED = 'disabled',
  BOTTOM = 'bottom',
  UNDER = 'under',
  THUMBNAIL = 'thumbnail',
}

export enum SpotifySettingIDs {
    CLIENT_ID = "client_id",
    CLIENT_SECRET = "client_secret",
    REDIRECT_URI = "redirect_uri",
    CHANGE_SOURCE = "change_source",
    OUTPUT_DEVICE = "output_device",
    TRANSFER_PLAYBACK_ON_ERROR = "transfer_playback_on_error",

    // Artistic Settings

    DISPLAY_ITEMS = "display_items",

    CONTROL_OPTIONS = "control_options",
    TEXT_JUSTIFICATION = "text_options",

    BACKDROP_BLUR_AMOUNT = "backdrop_blur_amount",


    // BLUR_BACKGROUND_THUMBNAIL = "blur_background_thumbnail",
    // BACKDROP_BLUR_AMNT = "backdrop_blur_amt",
    // SHOW_CONTROLS = "show_controls",
    // THUMBNAIL_SIZE = "thumbnail_size",
    // TEXT_SETTING = "text_setting", // how to render the text
}