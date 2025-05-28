import { APP_REQUESTS, AUDIO_REQUESTS, SongData } from "@deskthing/types";
import { Device, Playlist, SongQueue } from "./spotifyTypes";


export type ToClientTypes =
  | {
      type: APP_REQUESTS.SONG;
      payload: SongData | { thumbnail: string };
      request?: string
    }
    | {
      type: "playlists";
      payload: Playlist[];
      request?: string
    }
  | {
      type: "presets";
      payload: Playlist[];
    }
  | {
      type: "queueData";
      payload: SongQueue;
    }
  | {
      type: "auth";
      payload: { authStatus: boolean };
    }
  | {
      type: "device";
      payload: Device;
    };

export enum SpotifyEvent {
  GET = "get",
  SET = "set",
  ADD = "add",
  PLAY = "play",
  REMOVE = "remove",
}

export type ToServerTypes =
  | { type: SpotifyEvent.GET; request: "song" }
  | { type: SpotifyEvent.GET; request: "playlists" }
  | { type: SpotifyEvent.GET; request: "presets" }
  | { type: SpotifyEvent.GET; request: "queue" }

  | { type: SpotifyEvent.GET; request: "refresh" }

  | { type: SpotifyEvent.SET; request: "transfer"; payload: string }
  // Sets the current playlist to the preset
  | { type: SpotifyEvent.SET; request: "current_to_preset"; payload: number }
  | { type: SpotifyEvent.SET; request: "remove_preset"; payload: number }
  
  | { type: SpotifyEvent.SET; request: "preset"; payload: { presetNum: number; playlistId: string } }
  | { type: SpotifyEvent.SET; request: "like_song"; payload?: string }
  | { type: SpotifyEvent.SET; request: AUDIO_REQUESTS.LIKE; payload?: string }

  | { type: SpotifyEvent.SET; request: AUDIO_REQUESTS.PLAY; payload: { id?: string } }

  // Adds the current song to preset
  | { type: SpotifyEvent.ADD; request: "current_to_preset"; payload: number }
  | { type: SpotifyEvent.ADD; request: "song_to_preset"; payload: { presetNum: number; songId: string } }
  | { type: SpotifyEvent.ADD; request: "current_to_playlist"; payload: string }
  | { type: SpotifyEvent.ADD; request: "preset"; payload: string }
  | { type: SpotifyEvent.ADD; request: "queue"; payload: string }

  | { type: SpotifyEvent.PLAY; request: "preset"; payload: number }
  | { type: SpotifyEvent.PLAY; request: "playlist"; payload: string }

  | { type: SpotifyEvent.REMOVE; request: "queue"; payload: string }
