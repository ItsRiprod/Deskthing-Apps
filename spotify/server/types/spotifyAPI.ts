import { Device } from "@shared/spotifyTypes";

export interface ExternalUrls {
  spotify: string;
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface Restrictions {
  reason: string;
}

export interface Followers {
  href: string;
  total: number;
}

export interface Artist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  images: Image[];
  type: string;
  uri: string;
}

export interface SimplifiedArtist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface Show {
  available_markets: string[];
  copyrights: {
    text: string;
    type: string;
  }[];
  description: string;
  html_description: string;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  is_externally_hosted: boolean | null;
  languages: string[];
  media_type: string;
  name: string;
  publisher: string;
  type: "show";
  uri: string;
  total_episodes: number;
}

export interface Album {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  restrictions?: Restrictions;
  type: string;
  uri: string;
  artists: Artist[];
}

export interface ExternalIds {
  isrc: string;
  ean: string;
  upc: string;
}

export interface Track {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_playable: boolean;
  linked_from: Record<string, never>;
  restrictions?: Restrictions;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
}

export interface Episode {
  audio_preview_url: string | null;
  description: string;
  html_description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  is_externally_hosted: boolean;
  is_playable: boolean;
  language?: string;
  languages: string[];
  name: string;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  resume_point: {
    fully_played: boolean;
    resume_position_ms: number;
  };
  type: "episode";
  uri: string;
  restrictions?: Restrictions;
  show: Show;
}

export interface Context {
  type: "artist" | "playlist" | "album" | "show";
  href: string;
  external_urls: ExternalUrls;
  uri: string;
}

export interface Actions {
  interrupting_playback?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  seeking?: boolean;
  skipping_next?: boolean;
  skipping_prev?: boolean;
  toggling_repeat_context?: boolean;
  toggling_shuffle?: boolean;
  toggling_repeat_track?: boolean;
  transferring_playback?: boolean;
  disallows?: Disallows;
}

export interface Disallows {
  interrupting_playback?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  seeking?: boolean;
  skipping_next?: boolean;
  skipping_prev?: boolean;
  toggling_repeat_context?: boolean;
  toggling_shuffle?: boolean;
  toggling_repeat_track?: boolean;
  transferring_playback?: boolean;
}

export type PlayerResponse = {
  device: Device;
  repeat_state: "off" | "track" | "context";
  shuffle_state: boolean;
  context: Context | null;
  timestamp: number;
  progress_ms: number | null;
  is_playing: boolean;
  item: Track | Episode | null;
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
  actions: Actions;
} & (
  | {
      currently_playing_type: "track";
      item: Track;
    }
  | {
      currently_playing_type: "episode";
      item: Episode;
    }
  | {
      currently_playing_type: "ad" | "unknown";
      item: null;
    }
);

export interface User {
  external_urls: ExternalUrls;
  followers?: Followers;
  href: string;
  id: string;
  type: string;
  uri: string;
  display_name?: string;
}

export interface PlaylistTrack {
  added_at: string;
  added_by: User;
  is_local: boolean;
  track: Track;
}

export interface Paging<T> {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: T[];
}
export interface PlaylistResponse {
  collaborative: boolean;
  description: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: User;
  primary_color: string | null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

export interface PlaylistsResponse extends Paging<PlaylistResponse> {}

export interface QueueResponse {
  currently_playing: Track | Episode | null;
  queue: (Track | Episode)[];
}
