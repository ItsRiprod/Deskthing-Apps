import { ServerEvent } from "@deskthing/types";
import { Device, Playlist, SongQueue, SpotifySongData } from "./spotifyTypes";

export type ToClientTypes =
  | {
      type: "song";
      payload: SpotifySongData | { thumbnail: string };
    }
  | {
      type: "playlists";
      payload: Playlist[];
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
  REMOVE = "remove",
}

export type ToServerTypes =
  | { type: ServerEvent.GET; request: "song" }
  | { type: SpotifyEvent.GET; request: "playlists" }
  | { type: SpotifyEvent.GET; request: "presets" }
  | { type: SpotifyEvent.GET; request: "queue" }
  | { type: ServerEvent.GET; request: "refresh" }
  | { type: SpotifyEvent.SET; request: "transfer"; payload: string }
  | { type: SpotifyEvent.SET; request: "play_playlist"; payload: string }
  | { type: SpotifyEvent.SET; request: "play_preset"; payload: string }
  | { type: SpotifyEvent.SET; request: "set_preset"; payload: number }
  | { type: SpotifyEvent.SET; request: "add_preset"; payload: number }
  | { type: SpotifyEvent.SET; request: "like_song"; payload?: string }
  | { type: SpotifyEvent.SET; request: "add_queue"; payload: string }
  | { type: SpotifyEvent.REMOVE; request: "queue"; payload: string }
