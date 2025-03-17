import { SongData } from '@deskthing/types'

export interface SpotifySongData extends SongData {
  isLiked: boolean
}

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
