import { SpotifyStore as SpotifyStore } from "./spotifyStore";
import { DeskThing } from "@deskthing/server";
import { SpotifySongData } from "@shared/spotifyTypes";
import { Device, PlayerResponse } from "../types/spotifyAPI";
import EventEmitter from "node:events";

type songStoreEvents = {
  songUpdate: [Partial<SpotifySongData>];
  thumbnailUpdate: [string];
  deviceUpdate: [Device];
  iconUpdate: [{ id: string; state: string }];
};

export class SongStore extends EventEmitter<songStoreEvents> {
  private spotifyApi: SpotifyStore;
  private recent_device_id: string | undefined;

  constructor(spotifyApi: SpotifyStore) {
    super();
    this.spotifyApi = spotifyApi;
  }

  async getCurrentPlayback(): Promise<PlayerResponse | undefined> {
    return await this.spotifyApi.getCurrentPlayback();
  }

  async checkLiked(id: string): Promise<boolean> {
    try {
      if (!id) return false;
      const isLiked = await this.spotifyApi.makeRequest(
        "get",
        `https://api.spotify.com/v1/me/tracks/contains?ids=${id}`
      );
      this.emit("iconUpdate", {
        id: "like_song",
        state: isLiked[0] == true ? "liked" : "",
      });
      return isLiked;
    } catch (ex) {
      DeskThing.sendError("Error checking if song is liked!" + ex);
      return false;
    }
  }

  async checkForRefresh() {
    const playback = await this.spotifyApi.getCurrentPlayback();
    if (!playback) {
      DeskThing.sendError("Unable to get current playback");
      return;
    }

    await this.returnSongData(playback.item?.id);
  }

  async returnSongData(id: string | null = null) {
    try {
      const startTime = Date.now();
      const timeout = 5000;
      let delay = 500;
      let currentPlayback: PlayerResponse | undefined;
      let new_id: string | null = "";

      do {
        currentPlayback = await this.getCurrentPlayback();
        if (DeskThing.stopRequested) {
          DeskThing.sendLog("Stop requested!");
          throw new Error("Stop requested!");
        }
        if (currentPlayback?.currently_playing_type === "track") {
          new_id = currentPlayback?.item?.id || null;
          if (delay !== 500) {
            DeskThing.sendLog(`Song has not changed. Trying again...`);
          }

          delay *= 1.3;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else if (currentPlayback?.currently_playing_type === "episode") {
          currentPlayback = await this.getCurrentPlayback();
          DeskThing.sendLog("Playing a podcast!");
        } else {
          DeskThing.sendError("No song is playing or detected!");
          new_id = null;
          delay = 9999;
        }
      } while (
        new_id === id &&
        Date.now() - startTime < timeout &&
        delay < 1000
      );

      if (new_id === id) {
        throw new Error("Timeout Reached!");
      }

      let songData: Partial<SpotifySongData>;

      if (
        currentPlayback &&
        currentPlayback?.currently_playing_type === "track"
      ) {
        const isLiked = await this.checkLiked(currentPlayback.item.id);

        songData = {
          album: currentPlayback?.item.album?.name || "Not Found",
          artist: currentPlayback?.item.album?.artists[0].name || "Not Found",
          playlist: currentPlayback?.context?.type || "Not Found",
          playlist_id: currentPlayback?.context?.uri || "123456",
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state:
            currentPlayback?.repeat_state == "context"
              ? "all"
              : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward:
            !currentPlayback.actions?.disallows?.seeking || true,
          can_skip: !currentPlayback?.actions?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device.supports_volume || true,
          can_set_output:
            !currentPlayback?.actions?.disallows?.transferring_playback || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device?.volume_percent || undefined,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          isLiked: isLiked[0],
        };

        if (currentPlayback.device.id) {
          this.recent_device_id = currentPlayback.device.id;
          this.emit("deviceUpdate", currentPlayback.device);
        }

        this.emit("songUpdate", songData);

        const imageUrl = currentPlayback.item.album.images[0].url;
        const encodedImage = await DeskThing.encodeImageFromUrl(
          imageUrl,
          "jpeg"
        );
        this.emit("thumbnailUpdate", encodedImage);
      } else if (currentPlayback?.currently_playing_type === "episode") {
        songData = {
          album: currentPlayback?.item.show.name,
          artist: currentPlayback?.item.show.publisher,
          playlist: currentPlayback?.context?.type || "Not Found",
          playlist_id: currentPlayback?.context?.uri || "123456",
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state:
            currentPlayback?.repeat_state == "context"
              ? "all"
              : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward:
            !currentPlayback?.actions?.disallows?.seeking || true,
          can_skip: !currentPlayback?.actions?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device?.supports_volume || true,
          can_set_output:
            !currentPlayback?.actions?.disallows?.transferring_playback || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent || undefined,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          isLiked: false,
        };

        if (currentPlayback.device.id) {
          this.recent_device_id = currentPlayback.device.id;
          this.emit("deviceUpdate", currentPlayback.device);
        }

        this.emit("songUpdate", songData);

        const imageUrl = currentPlayback.item.images[0].url;
        const encodedImage = await DeskThing.encodeImageFromUrl(
          imageUrl,
          "jpeg"
        );
        this.emit("thumbnailUpdate", encodedImage);
      } else {
        DeskThing.sendError("Song/Podcast type not supported!");
      }
    } catch (error) {
      DeskThing.sendError("Error getting song data:" + error);
      return error;
    }
  }

  async likeSong(songId?: string) {
    if (!songId) {
      const song = await this.getCurrentPlayback();
      if (!song?.item) {
        DeskThing.sendError("No song found!");
        return;
      }
      songId = song?.item?.id as string;
    }

    const isLiked = await this.checkLiked(songId);
    const songURL = `https://api.spotify.com/v1/me/tracks?ids=${songId}`;

    const data = {
      ids: [songId],
    };

    try {
      if (isLiked[0]) {
        DeskThing.sendLog("Disliking the current song");
        await this.spotifyApi.makeRequest("delete", songURL, data);
        DeskThing.sendLog("Successfully unliked song: " + songId);
        this.emit("iconUpdate", { id: "like_song", state: "" });
        return;
      } else {
        DeskThing.sendLog("Liking the current song");
        await this.spotifyApi.makeRequest("put", songURL, data);
        DeskThing.sendLog("Successfully liked song: " + songId);
        this.emit("iconUpdate", { id: "like_song", state: "liked" });
      }
    } catch (error) {
      DeskThing.sendError("Failed to like song: " + error);
    }
  }
}
