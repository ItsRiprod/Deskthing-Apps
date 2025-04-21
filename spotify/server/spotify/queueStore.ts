import { SpotifyStore } from "./spotifyStore";
import { DeskThing } from "@deskthing/server";
import { Episode, QueueResponse, Track } from "../types/spotifyAPI";
import EventEmitter from "node:events";
import { SongStore } from "./songStore";
import { AbbreviatedSong, SongQueue } from "@shared/spotifyTypes";
import { getEncodedImage } from "../utils/imageUtils";

type queueStoreEvents = {
  queueUpdate: [SongQueue];
};

export class QueueStore extends EventEmitter<queueStoreEvents> {
  private spotifyApi: SpotifyStore;
  private is_refreshing: { state: boolean; timestamp: number } = { state: false, timestamp: 0 };
  private rawQueueData: QueueResponse | undefined;
  private queueData: SongQueue | undefined;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10000; // Cache expires after 10 seconds

  constructor(spotifyApi: SpotifyStore) {
    super();
    this.spotifyApi = spotifyApi;
  }

  private isTrack(item: Track | Episode): item is Track {
    return item.type === 'track';
  }
  
  private isEpisode(item: Track | Episode): item is Episode {
    return item.type === 'episode';
  }

  private isCacheValid(): boolean {
    return (
      this.queueData !== undefined &&
      Date.now() - this.lastFetchTime < this.CACHE_DURATION
    );
  }

  private async getCurrentQueue({ signal }: { signal?: AbortSignal } = {}): Promise<QueueResponse | undefined> {
    DeskThing.sendDebug("QueueStore: getCurrentQueue");
    try {
      const currentQueue = await this.spotifyApi.getCurrentQueue({ signal });
      if (!currentQueue) {
        DeskThing.sendWarning("No queue data available");
        return undefined;
      }
      DeskThing.sendLog("Got the current queue successfully");

      this.rawQueueData = currentQueue;
      this.lastFetchTime = Date.now();
      return currentQueue;
    } catch (error) {
      DeskThing.sendError("Error getting current queue: " + error);
      return undefined;
    }
  }
  async getQueueData(): Promise<SongQueue | undefined> {
    DeskThing.sendDebug("QueueStore: getQueueData");
    if (this.isCacheValid()) {
      DeskThing.sendDebug("QueueStore: getQueueData - using cached data");
      return this.queueData;
    }

    const queue = await this.getCurrentQueue();
    if (!queue) {
      DeskThing.sendError("No queue data available");
      return undefined;
    }
    return await this.getAbbreviatedSongs(queue);
  }

  async addToQueue(uri: string) {
    DeskThing.sendDebug("QueueStore: addToQueue " + uri);
    await this.spotifyApi.addToQueue(
      uri.startsWith("spotify:track:") ? uri : "spotify:track:" + uri
    );
  }

  async checkForRefresh() {
    // Early returns for already refreshing or valid cache
    if (this.is_refreshing) {
      DeskThing.sendDebug(
        `QueueStore: checkForRefresh - already refreshing, skipping...`
      );
      return;
    }

    if (this.isCacheValid()) {
      DeskThing.sendDebug("QueueStore: checkForRefresh - using cached data");
      return;
    }

    this.is_refreshing = { state: true, timestamp: Date.now() };
    
    try {
      // Use AbortController for proper timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const queue = await this.getCurrentQueue({ signal: controller.signal });
        
        // Clear timeout as request completed
        clearTimeout(timeoutId);
        
        if (!queue) {
          DeskThing.sendError("Unable to get current queue");
          return;
        }

        if (
          queue.currently_playing?.id === 
          this.rawQueueData?.currently_playing?.id
        ) {
          DeskThing.sendDebug(
            "QueueStore: checkForRefresh - no change, skipping..."
          );
          return;
        }

        this.rawQueueData = queue;
        this.emit("queueUpdate", await this.getAbbreviatedSongs(queue));
      } catch (error) {
        // Handle abort errors separately from other errors
        if (error instanceof Error && error.name === 'AbortError') {
          DeskThing.sendError("Queue refresh request timed out");
        } else {
          DeskThing.sendError("Error checking queue: " + error);
        }
      } finally {
        clearTimeout(timeoutId); // Ensure timeout is cleared in all cases
      }
    } finally {
      this.is_refreshing = { state: false, timestamp: 0 };
    }
  }

  async returnQueueData(): Promise<void> {
    DeskThing.sendDebug("QueueStore: returnQueueData");
    try {
      if (this.isCacheValid()) {
        if (this.queueData) {
          this.emit("queueUpdate", this.queueData);
          return;
        }
      }

      const queue = await this.getCurrentQueue();
      if (!queue) {
        DeskThing.sendError("No queue data available");
        return;
      }

      this.emit("queueUpdate", await this.getAbbreviatedSongs(queue));
    } catch (error) {
      DeskThing.sendError("Error getting queue data:" + error);
      return;
    }
  }

  private async getAbbreviatedSongs(queue: QueueResponse): Promise<SongQueue> {
    const queueData = {
      queue: await Promise.all(
        queue.queue.map(async (song) => {
          if ("album" in song) {
            return {
              id: song.id,
              name: song.name,
              artists: song.artists.map((artist) => artist.name),
              album: song.album.name,
              thumbnail: await getEncodedImage(song.album.images[0].url),
            };
          } else {
            return {
              id: "spotify:track:" + song.id,
              name: song.name,
              artists: [song.show.publisher],
              album: song.show.name,
              thumbnail: await getEncodedImage(song.show.images[0].url),
            };
          }
        })
      ),
      currently_playing: queue.currently_playing
        ? "album" in queue.currently_playing
          ? {
              id: queue.currently_playing.id,
              name: queue.currently_playing.name,
              artists: queue.currently_playing.artists.map(
                (artist) => artist.name
              ),
              album: queue.currently_playing.album.name,
              thumbnail: await getEncodedImage(
                queue.currently_playing.album.images[0].url
              ),
            }
          : {
              id: "spotify:track:" + queue.currently_playing.id,
              name: queue.currently_playing.name,
              artists: [queue.currently_playing.show.publisher],
              album: queue.currently_playing.show.name,
              thumbnail: await getEncodedImage(
                queue.currently_playing.show.images[0].url
              ),
            }
        : null,
    };

    
    this.queueData = queueData;
    this.lastFetchTime = Date.now();
    
    this.emit("queueUpdate", queueData);
    
    return queueData;
  }

  private async getAbbreviatedSongs2(queue: QueueResponse): Promise<SongQueue> {
    const processedQueue = await Promise.all(
      (queue.queue || []).map(async (song) => {
        try {
          if (this.isTrack(song)) {
            return {
              id: song.id,
              name: song.name || "Unknown Track",
              artists: song.artists?.map(artist => artist.name) || ["Unknown Artist"],
              album: song.album?.name || "Unknown Album",
              thumbnail: song.album?.images?.[0]?.url || "",
              type: 'track'
            };
          } else if (this.isEpisode(song)) {
            return {
              id: `spotify:episode:${song.id}`,
              name: song.name || "Unknown Episode",
              artists: song.show?.publisher ? [song.show.publisher] : ["Unknown Publisher"],
              album: song.show?.name || "Unknown Show",
              thumbnail: song.show?.images?.[0]?.url || "",
              type: 'episode'
            };
          } else {
            // Handle unknown content type
            return {
              id: "unknown",
              name: "Unknown Item",
              artists: ["Unknown Artist"],
              album: "Unknown Album",
              thumbnail: "",
              type: 'unknown'
            };
          }
        } catch (error) {
          DeskThing.sendWarning(`Failed to process queue item: ${error}`);
          return {
            id: "error",
            name: "Error Processing Item",
            artists: ["Error"],
            album: "Error",
            thumbnail: "",
            type: 'error'
          };
        }
      })
    );

    let currentlyPlaying: AbbreviatedSong | null = null
    if (queue.currently_playing) {
      try {
        if (this.isTrack(queue.currently_playing)) {
          currentlyPlaying = {
            id: queue.currently_playing.id,
            name: queue.currently_playing.name || "Unknown Track",
            artists: queue.currently_playing.artists?.map(artist => artist.name) || ["Unknown Artist"],
            album: queue.currently_playing.album?.name || "Unknown Album",
            thumbnail: queue.currently_playing.album?.images?.[0]?.url || "",
          };
        } else if (this.isEpisode(queue.currently_playing)) {
          currentlyPlaying = {
            id: `spotify:episode:${queue.currently_playing.id}`,
            name: queue.currently_playing.name || "Unknown Episode",
            artists: queue.currently_playing.show?.publisher ? [queue.currently_playing.show.publisher] : ["Unknown Publisher"],
            album: queue.currently_playing.show?.name || "Unknown Show",
            thumbnail: queue.currently_playing?.images?.[0]?.url || "",
          };
        }
      } catch (error) {
        DeskThing.sendWarning(`Failed to process currently playing item: ${error}`);
      }
    }
  
    const queueData: SongQueue = {
      queue: processedQueue.filter(Boolean), // Remove any null entries
      currently_playing: currentlyPlaying
    };
  
    this.queueData = queueData;
    this.lastFetchTime = Date.now();
  
    this.emit("queueUpdate", queueData);
  
    return queueData;
  }
}
