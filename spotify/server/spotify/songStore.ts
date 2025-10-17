import { SpotifyStore as SpotifyStore } from "./spotifyStore";
import { DeskThing } from "@deskthing/server";
import { Device } from "../../shared/spotifyTypes";
import { Actions, PlayerResponse } from "../types/spotifyAPI";
import EventEmitter from "node:events";
import { DeviceStore } from "./deviceStore"
import { SongAbilities, SongData11 } from "@deskthing/types";

type songStoreEvents = {
  songUpdate: [SongData11];
  rawSongUpdate: [PlayerResponse];
  thumbnailUpdate: [string];
  deviceUpdate: [Device];
  iconUpdate: [{ id: string; state: string }];
};

export class SongStore extends EventEmitter<songStoreEvents> {
  private spotifyApi: SpotifyStore;
  private deviceStore: DeviceStore;

  private recent_device_id: string | undefined;
  private recentPlaybackState = {
    songId: null as string | null,
    isPlaying: false,
    progress: 0,
    volume: 0,
    repeatState: "",
    shuffleState: false,
  };
  private is_refreshing: { state: boolean; timestamp: number } = { state: false, timestamp: 0 };

  constructor(spotifyApi: SpotifyStore, deviceStore: DeviceStore) {
    super();
    this.spotifyApi = spotifyApi;
    this.deviceStore = deviceStore;
  }

  async getCurrentPlayback({ signal }: { signal?: AbortSignal } = {}): Promise<PlayerResponse | undefined> {
    try {
      const currentPlayback = await this.spotifyApi.getCurrentPlayback({ signal });
      if (!currentPlayback) return undefined;

      this.deviceStore.addDevicesFromPlayback(currentPlayback);
      this.emit("rawSongUpdate", currentPlayback);
      return currentPlayback;
    } catch (error) {
      if (!(error instanceof Error)) {
        console.error(`Error getting current playback: ${error}`);
        return undefined;
      }
      console.error(`Error getting current playback: ${error.message}`);
      return undefined;
    }
  }

  async checkLiked(id: string): Promise<boolean> {
    try {
      if (!id) return false;
      const isLiked = await this.spotifyApi.checkLiked(id);
      this.emit("iconUpdate", {
        id: "like_song",
        state: isLiked[0] == true ? "liked" : "",
      });
      console.debug('IsSongLiked? ', isLiked)
      return isLiked[0];
    } catch (ex) {
      console.error("Error checking if song is liked!" + ex);
      return false;
    }
  }

  async checkForRefresh() {
    if (this.is_refreshing.state && Date.now() - this.is_refreshing.timestamp < 5000) {
      console.debug(
        `SongStore: checkForRefresh - already refreshing, skipping...`
      );
      return;
    }
    this.is_refreshing = { state: true, timestamp: Date.now() };

    try {
      // Use AbortController for proper timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const playback = await this.getCurrentPlayback({ signal: controller.signal });

        // Clear timeout as request completed
        clearTimeout(timeoutId);

        if (!playback) {
          console.warn("Unable to get current playback (is anything playing?)");
          return;
        }

        // Check for any relevant state changes
        const stateChanged =
          playback.item?.id !== this.recentPlaybackState.songId ||
          playback.is_playing !== this.recentPlaybackState.isPlaying ||
          Math.abs(
            (playback.progress_ms || 0) - this.recentPlaybackState.progress
          ) > 3000 || // Allow small progress differences
          (playback.device?.volume_percent || 0) !==
          this.recentPlaybackState.volume ||
          playback.repeat_state !== this.recentPlaybackState.repeatState ||
          playback.shuffle_state !== this.recentPlaybackState.shuffleState;


        // Update our stored state
        this.recentPlaybackState = {
          songId: playback.item?.id || null,
          isPlaying: playback.is_playing || false,
          progress: playback.progress_ms || 0,
          volume: playback.device?.volume_percent || 0,
          repeatState: playback.repeat_state || "",
          shuffleState: playback.shuffle_state || false,
        };

        if (stateChanged) {
          console.debug("Playback state changed, refreshing...");
          const songData = await this.constructSongData(playback);
          this.emit("songUpdate", songData);
        } else {
          console.debug("No significant state changes detected");
        }
      } catch (error) {
        // Handle abort errors separately from other errors
        if (error instanceof Error && error.name === 'AbortError') {
          console.error("Playback refresh request timed out");
        } else {
          console.error("Error checking for state changes: " + error);
        }
      } finally {
        clearTimeout(timeoutId); // Ensure timeout is cleared in all cases
      }
    } finally {
      this.is_refreshing = { state: false, timestamp: 0 };
    }
  }
  async returnSongData(id: string | null = null): Promise<void> {
    console.debug("SongStore: returnSongData");
    try {
      const startTime = Date.now();
      const timeout = 5000;
      const maxAttempts = 1;
      let attempts = 0;
      let currentPlayback: PlayerResponse | undefined;

      while (attempts < maxAttempts) {
        if (DeskThing.stopRequested) {
          console.log("Stop requested!");
          throw new Error("Stop requested!");
        }

        currentPlayback = await this.getCurrentPlayback();

        if (!currentPlayback) {
          console.error("No playback data available");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
          continue;
        }

        if (currentPlayback.currently_playing_type === "track") {
          const new_id = currentPlayback.item?.id || null;

          if (new_id !== id) {
            // We have a new track, process it
            const songData = await this.constructSongData(currentPlayback);

            if (currentPlayback.device.id) {
              this.recent_device_id = currentPlayback.device.id;
              this.emit("deviceUpdate", currentPlayback.device);
            }

            console.debug(
              "SongStore: songData: " + JSON.stringify(songData)
            );
            this.emit("songUpdate", songData);
            return;
          }

          // Same track, wait before next attempt
          console.log("Song has not changed. Trying again...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else if (currentPlayback.currently_playing_type === "episode") {
          const songData = await this.constructSongData(currentPlayback);
          this.emit("songUpdate", songData);
          return;
        } else {
          console.error("No song is playing or detected!");
          return;
        }

        if (Date.now() - startTime >= timeout) {
          throw new Error("Timeout reached!");
        }

        attempts++;
      }

      throw new Error("Max attempts reached without finding new song!");
    } catch (error) {
      console.error("Error getting song data:" + error);
      return;
    }
  }

  private async constructSongData(
    currentPlayback: PlayerResponse
  ): Promise<SongData11> {
    if (
      currentPlayback.device.id &&
      currentPlayback.device.id != this.recent_device_id
    ) {
      this.recent_device_id = currentPlayback.device.id;
      this.emit("deviceUpdate", currentPlayback.device);
    }

    if (currentPlayback?.currently_playing_type === "track") {
      return await this.constructSongType(currentPlayback);
    } else if (currentPlayback?.currently_playing_type === "episode") {
      return await this.constructEpisodeType(currentPlayback);
    } else {
      throw new Error(
        `Song type ${currentPlayback?.currently_playing_type} not supported!`
      );
    }
  }

  private returnAbilities(actions: Actions): SongAbilities[] {
    const abilities: SongAbilities[] = [];
    const disallows = actions.disallows || {};

    if (actions.pausing || !disallows.pausing) abilities.push(SongAbilities.PAUSE);
    if (actions.resuming || !disallows.resuming) abilities.push(SongAbilities.PLAY);
    if (actions.seeking || !disallows.seeking) abilities.push(SongAbilities.FAST_FORWARD, SongAbilities.REWIND);
    if (actions.skipping_next || !disallows.skipping_next) abilities.push(SongAbilities.NEXT);
    if (actions.skipping_prev || !disallows.skipping_prev) abilities.push(SongAbilities.PREVIOUS);
    if (actions.toggling_shuffle || !disallows.toggling_shuffle) abilities.push(SongAbilities.SHUFFLE);
    if ((actions.toggling_repeat_context || !disallows.toggling_repeat_context) ||
      (actions.toggling_repeat_track || !disallows.toggling_repeat_track)) abilities.push(SongAbilities.REPEAT);
    if (actions.transferring_playback || !disallows.transferring_playback) abilities.push(SongAbilities.SET_OUTPUT);

    abilities.push(SongAbilities.LIKE, SongAbilities.CHANGE_VOLUME);

    return abilities;
  }

  async constructSongType(
    currentPlayback: Extract<
      PlayerResponse,
      { currently_playing_type: "track" }
    >
  ): Promise<SongData11> {
    const isLiked = await this.checkLiked(currentPlayback.item.id);

    return {
      version: 2,
      album: currentPlayback?.item.album?.name || "Not Found",
      artist: currentPlayback?.item.album?.artists[0].name || "Not Found",
      playlist: currentPlayback?.context?.type || "Not Found",
      playlist_id: currentPlayback?.context?.uri || "123456",
      track_name: currentPlayback?.item.name,
      shuffle_state: currentPlayback?.shuffle_state,
      repeat_state:
        currentPlayback?.repeat_state == "context"
          ? "all"
          : currentPlayback?.repeat_state,
      is_playing: currentPlayback?.is_playing,
      track_duration: currentPlayback?.item.duration_ms,
      track_progress: currentPlayback?.progress_ms,
      volume: currentPlayback?.device?.volume_percent || 50,
      device: currentPlayback?.device?.name,
      device_id: currentPlayback?.device?.id,
      id: currentPlayback?.item?.id,
      liked: isLiked[0],
      thumbnail: currentPlayback.item?.album?.images[0]?.url,
      source: 'spotify',
      abilities: this.returnAbilities(currentPlayback?.actions),

      // depreciated
      can_fast_forward: !currentPlayback.actions?.disallows?.seeking || true,
      can_skip: !currentPlayback?.actions?.disallows?.skipping_next || true,
      can_like: true,
      can_change_volume: currentPlayback?.device?.supports_volume || true,
      can_set_output:
        !currentPlayback?.actions?.disallows?.transferring_playback || true,
    };
  }
  async constructEpisodeType(
    currentPlayback: Extract<
      PlayerResponse,
      { currently_playing_type: "episode" }
    >
  ): Promise<SongData11> {
    return {
      version: 2,
      album: currentPlayback?.item?.show?.name || 'Podcast',
      artist: currentPlayback?.item?.show?.publisher || 'Author',
      playlist: currentPlayback?.context?.type || "Not Found",
      playlist_id: currentPlayback?.context?.uri || "123456",
      track_name: currentPlayback?.item.name,
      shuffle_state: currentPlayback?.shuffle_state,
      repeat_state:
        currentPlayback?.repeat_state == "context"
          ? "all"
          : currentPlayback?.repeat_state,
      is_playing: currentPlayback?.is_playing,
      track_duration: currentPlayback?.item.duration_ms,
      track_progress: currentPlayback?.progress_ms,
      volume: currentPlayback?.device.volume_percent || 50,
      device: currentPlayback?.device.name,
      device_id: currentPlayback?.device.id,
      id: currentPlayback?.item.id,
      thumbnail: currentPlayback.item?.show?.images[0]?.url,
      source: 'spotify',
      abilities: this.returnAbilities(currentPlayback?.actions),
      liked: false,
      
      // Depreciated data
      can_fast_forward: !currentPlayback?.actions?.disallows?.seeking || true,
      can_skip: !currentPlayback?.actions?.disallows?.skipping_next || true,
      can_like: true,
      can_change_volume: currentPlayback?.device?.supports_volume || true,
      can_set_output:
        !currentPlayback?.actions?.disallows?.transferring_playback || true,
    };
  }

  async likeSong(songId?: string | boolean) {
    if (!songId) {
      const song = await this.getCurrentPlayback();
      if (!song?.item) {
        console.error("No song found!");
        return;
      }
      songId = song?.item?.id as string;
    }

    let isLiked: boolean

    if (typeof songId == 'boolean') {
      isLiked = songId
      const currentSong = await this.getCurrentPlayback()
      songId = currentSong?.item?.id
      if (!songId) return
    } else {
      isLiked = await this.checkLiked(songId);
    }

    try {
      if (isLiked) {
        console.log("Disliking the current song");
        await this.spotifyApi.likeSong(songId, false);
        console.log("Successfully unliked song: " + songId);
        this.emit("iconUpdate", { id: "like_song", state: "" });
        return;
      } else {
        console.log("Liking the current song", isLiked);
        await this.spotifyApi.likeSong(songId, true);
        console.log("Successfully liked song: " + songId);
        this.emit("iconUpdate", { id: "like_song", state: "liked" });
      }
    } catch (error) {
      console.error("Failed to like song: " + error);
    }
  }
}
