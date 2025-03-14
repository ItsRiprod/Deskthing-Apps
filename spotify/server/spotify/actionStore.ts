import { DeskThing } from "@deskthing/server";

import { Action, ActionReference, SocketData } from "@deskthing/types";
import { SpotifyStore } from "./spotifyStore";
import { AuthStore } from "./authStore";
import { PlaylistStore } from "./playlistStore";
import { SongStore } from "./songStore";

export class ActionStore {
  private spotifyApi: SpotifyStore;
  private spotifyAuth: AuthStore;
  private playlistStore: PlaylistStore;
  private songStore: SongStore;

  constructor(spotifyApi: SpotifyStore, spotifyAuth: AuthStore, playlistStore: PlaylistStore, songStore: SongStore) {
    this.spotifyApi = spotifyApi;
    this.spotifyAuth = spotifyAuth;
    this.playlistStore = playlistStore;
    this.songStore = songStore;
  }

  async handleAction(action: Action | ActionReference) {
    try {
      switch (action.id) {
        case "set_playlist":
          if (typeof action.value === "number") {
            await this.playlistStore.setPlaylist(action.value);
          } else {
            DeskThing.sendError("Invalid Playlist Index");
          }
          break;

        case "play_playlist":
          if (typeof action.value === "number") {
            await this.playlistStore.playPlaylistByIndex(action.value);
          } else if (typeof action.value === "string") {
            await this.playlistStore.playPlaylist(action.value);
          } else {
            DeskThing.sendError("Invalid Playlist ID");
          }
          break;

        case "like_song":
          await this.songStore.likeSong();
          break;

        case "refresh_song":
          await this.songStore.checkForRefresh();
          break;

        case "cycle_key":
          await this.spotifyAuth.refreshAccessToken();
          break;

        default:
          DeskThing.sendError(`Unknown action: ${action.id}`);
      }
    } catch (error) {
      DeskThing.sendError(`Error handling action: ${error}`);
    }
  }

  async next(id: string = "") {
    return this.spotifyApi.next();
  }

  async previous() {
    return this.spotifyApi.previous();
  }

  async pause() {
    return this.spotifyApi.pause();
  }

  async play(context?: { playlist: string; id: string; position: number }) {
    if (context) {
      return this.spotifyApi.play({
        context_uri: context.playlist,
        offset: { uri: `spotify:track:${context.id}` },
        position_ms: context.position
      });
    }
    return this.spotifyApi.play({ context_uri: '' });
  }

  async seek(position: string | number) {
    return this.spotifyApi.seek(position);
  }

  async volume(newVol: number) {
    return this.spotifyApi.volume(newVol);
  }

  async repeat(state: string) {
    return this.spotifyApi.repeat(state);
  }

  async shuffle(state: string) {
    return this.spotifyApi.shuffle(state);
  }

  async transferPlayback(deviceId: string) {
    DeskThing.sendLog(`Transferring playback to ${deviceId}`);
    return this.spotifyApi.transferPlayback(deviceId);
  }

  async fastForward(seconds = 15) {
    try {
      const playback = await this.spotifyApi.getCurrentPlayback();
      const currentPosition = playback?.progress_ms;

      if (!currentPosition) {
        DeskThing.sendError("No current position found!");
        return;
      }

      const newPosition = currentPosition + seconds * 1000
      await this.seek(newPosition);
    } catch (error) {
      DeskThing.sendError("Error fast forwarding!" + error);
    }
  }

  async rewind(seconds = 15) {
    try {
      const playback = await this.spotifyApi.getCurrentPlayback();
      const currentPosition = playback?.progress_ms;

      if (!currentPosition) {
        DeskThing.sendError("No current position found!");
        return;
      }

      const newPosition = currentPosition - seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      DeskThing.sendError("Error rewinding!" + error);
    }
  }
}