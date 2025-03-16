import { SpotifyStore } from "./spotifyStore";
import { DeskThing } from "@deskthing/server";
import { QueueResponse } from "../types/spotifyAPI";
import EventEmitter from "node:events";
import { SongStore } from "./songStore";
import { SongQueue } from "@shared/spotifyTypes";
import { getEncodedImage } from "../utils/imageUtils"

type queueStoreEvents = {
  queueUpdate: [SongQueue];
};

export class QueueStore extends EventEmitter<queueStoreEvents> {
  private spotifyApi: SpotifyStore;
  private is_refreshing: boolean = false;
  private rawQueueData: QueueResponse | undefined;
  private queueData: SongQueue | undefined;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10000; // Cache expires after 10 seconds

  constructor(spotifyApi: SpotifyStore) {
    super();
    this.spotifyApi = spotifyApi;
  }

  private isCacheValid(): boolean {
    return (
      this.queueData !== undefined &&
      Date.now() - this.lastFetchTime < this.CACHE_DURATION
    );
  }

  private async getCurrentQueue(): Promise<QueueResponse | undefined> {
    DeskThing.sendDebug('QueueStore: getCurrentQueue');
    try {
      const currentQueue = await this.spotifyApi.getCurrentQueue();
      if (!currentQueue) {
        DeskThing.sendWarning('No queue data available');
        return undefined
      };
      DeskThing.sendLog('Got the current queue successfully')

      this.rawQueueData = currentQueue;
      this.lastFetchTime = Date.now();
      return currentQueue;
    } catch (error) {
      DeskThing.sendError("Error getting current queue: " + error);
      return undefined;
    }
  }

  async getQueueData(): Promise<SongQueue | undefined> {
    DeskThing.sendDebug('QueueStore: getQueueData');
    if (this.isCacheValid()) {
      DeskThing.sendDebug('QueueStore: getQueueData - using cached data');
      return this.queueData;
    }

    const queue = await this.getCurrentQueue();
    if (!queue) {
      DeskThing.sendError('No queue data available');
      return undefined;
    }
    return await this.getAbbreviatedSongs(queue);
  }

  async addToQueue(uri: string) {
    DeskThing.sendDebug('QueueStore: addToQueue ' + uri);
    await this.spotifyApi.addToQueue(uri.startsWith('spotify:track:') ? uri : 'spotify:track:' + uri);
  }

  async checkForRefresh() {
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

    this.is_refreshing = true;
    try {
      const queue = await this.getCurrentQueue();
      if (!queue) {
        DeskThing.sendError("Unable to get current queue");
        return;
      }

      if (queue.currently_playing?.id == this.rawQueueData?.currently_playing?.id) {
        DeskThing.sendDebug("QueueStore: checkForRefresh - no change, skipping...");
        return;
      }

      this.rawQueueData = queue;
      this.emit("queueUpdate", await this.getAbbreviatedSongs(queue));
    } catch (error) {
      DeskThing.sendError("Error checking queue: " + error);
    } finally {
      this.is_refreshing = false;
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
              id: 'spotify:track:' + song.id,
              name: song.name,
              artists: [song.show.publisher],
              album: song.show.name,
              thumbnail: await getEncodedImage(song.show.images[0].url)
            };
          }
        })),
      currently_playing: queue.currently_playing
        ? "album" in queue.currently_playing
          ? {
              id: queue.currently_playing.id,
              name: queue.currently_playing.name,
              artists: queue.currently_playing.artists.map(
                (artist) => artist.name
              ),
              album: queue.currently_playing.album.name,
              thumbnail: await getEncodedImage(queue.currently_playing.album.images[0].url),
            }
          : {
              id: 'spotify:track:' + queue.currently_playing.id,
              name: queue.currently_playing.name,
              artists: [queue.currently_playing.show.publisher],
              album: queue.currently_playing.show.name,
              thumbnail: await getEncodedImage(queue.currently_playing.show.images[0].url),
            }
        : null,
    };

    this.queueData = queueData;
    this.lastFetchTime = Date.now();

    this.emit('queueUpdate', queueData);

    return queueData;
  }
}