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
  ADD = "add",
  PLAY = "play",
  REMOVE = "remove",
}

export type ToServerTypes =
  | { type: ServerEvent.GET; request: "song" }
  | { type: SpotifyEvent.GET; request: "playlists" }
  | { type: SpotifyEvent.GET; request: "presets" }
  | { type: SpotifyEvent.GET; request: "queue" }

  | { type: ServerEvent.GET; request: "refresh" }

  | { type: SpotifyEvent.SET; request: "transfer"; payload: string }
  // Sets the current playlist to the preset
  | { type: SpotifyEvent.SET; request: "current_to_preset"; payload: number }
  
  | { type: SpotifyEvent.SET; request: "preset"; payload: { presetNum: number; playlistId: string } }
  | { type: SpotifyEvent.SET; request: "like_song"; payload?: string }

  // Adds the current song to preset
  | { type: SpotifyEvent.ADD; request: "current_to_preset"; payload: number }
  | { type: SpotifyEvent.ADD; request: "current_to_playlist"; payload: string }
  | { type: SpotifyEvent.ADD; request: "preset"; payload: string }
  | { type: SpotifyEvent.ADD; request: "queue"; payload: string }

  | { type: SpotifyEvent.PLAY; request: "preset"; payload: number }
  | { type: SpotifyEvent.PLAY; request: "playlist"; payload: string }

  | { type: SpotifyEvent.REMOVE; request: "queue"; payload: string }
