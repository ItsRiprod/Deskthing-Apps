import { DeskThing } from "@deskthing/server";

import { Action, ActionReference, SocketData } from "@deskthing/types";
import { SpotifyStore } from "./spotifyStore";
import { AuthStore } from "./authStore";
import { PlaylistStore } from "./playlistStore";
import { SongStore } from "./songStore";
import { SpotifyActionIDs } from "../setupActions";

export class ActionStore {
  private spotifyApi: SpotifyStore;
  private spotifyAuth: AuthStore;
  private playlistStore: PlaylistStore;
  private songStore: SongStore;
  private context_uri: string | undefined

  constructor(spotifyApi: SpotifyStore, spotifyAuth: AuthStore, playlistStore: PlaylistStore, songStore: SongStore) {
    this.spotifyApi = spotifyApi;
    this.spotifyAuth = spotifyAuth;
    this.playlistStore = playlistStore;
    this.songStore = songStore;

    this.songStore.on('rawSongUpdate', (song) => {
      if (!song?.context?.uri) return
      this.context_uri = song.context.uri;
    })
  }

  async handleAction(action: Action | ActionReference) {
    try {
      switch (action.id) {
        case SpotifyActionIDs.SET_PLAYLIST:
          if (typeof action.value === "number") {
            await this.playlistStore.addCurrentPlaylistToPreset(action.value + 1);
          } else {
            console.error("Invalid Playlist Index");
          }
          break;

        case SpotifyActionIDs.PLAY_PLAYLIST:
          if (typeof action.value === "number") {
            await this.playlistStore.playPreset(action.value + 1);
          } else if (typeof action.value === "string") {
            await this.playlistStore.playPlaylist(action.value);
          } else {
            console.error("Invalid Playlist ID");
          }
          break;

        case SpotifyActionIDs.LIKE_SONG:
          await this.songStore.likeSong();
          break;

        case SpotifyActionIDs.REFRESH_SONG:
          await this.songStore.checkForRefresh();
          break;

        case SpotifyActionIDs.CYCLE_KEY:
          await this.spotifyAuth.refreshAccessToken();
          break;

        default:
          console.error(`Unknown action: ${action.id}`);
      }
    } catch (error) {
      console.error(`Error handling action: ${error}`);
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

  /**
   * id - content id
   * playlist - playlist id
   * position - position in playlist
   * @param context 
   * @returns 
   */
  async play(context?: { playlist?: string; id?: string; position?: number }) {
    try {

      if (context) {
        console.debug(`Playing ${context.id ? 'track' : 'playlist'}`);
        return this.spotifyApi.play({
          context_uri: context.playlist ? `spotify:playlist:${context.playlist}` : undefined,
          uris: context.id ? [context.id.includes('spotify:') ? context.id : `spotify:track:${context.id}`] : undefined,
          offset: context.position !== undefined ? { position: context.position } : undefined,
        });
      }
      console.debug('Resuming current song');
      return this.spotifyApi.play();
    } catch (error) {
      console.error("Error playing:", error);
    }
  }
  async seek(position: string | number) {
    return this.spotifyApi.seek(position);
  }

  async volume(newVol: number) {
    return this.spotifyApi.volume(newVol);
  }

  async repeat(state: "off" | "all" | "track") {
    return this.spotifyApi.repeat(state);
  }

  async shuffle(state: boolean) {
    return this.spotifyApi.shuffle(state);
  }

  async transferPlayback(deviceId: string) {
    console.log(`Transferring playback to ${deviceId}`);
    return this.spotifyApi.transferPlayback(deviceId);
  }

  async fastForward(seconds = 15) {
    try {
      const playback = await this.spotifyApi.getCurrentPlayback();
      const currentPosition = playback?.progress_ms;

      if (!currentPosition) {
        console.error("No current position found!");
        return;
      }

      const newPosition = currentPosition + seconds * 1000
      await this.seek(newPosition);
    } catch (error) {
      console.error("Error fast forwarding!" + error);
    }
  }

  async rewind(seconds = 15) {
    try {
      const playback = await this.spotifyApi.getCurrentPlayback();
      const currentPosition = playback?.progress_ms;

      if (!currentPosition) {
        console.error("No current position found!");
        return;
      }

      const newPosition = currentPosition - seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      console.error("Error rewinding!" + error);
    }
  }
}