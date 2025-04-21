import { DeskThing } from "@deskthing/server";
import { AuthStore } from "./authStore";
import {
  Album,
  Artist,
  PlayerResponse,
  PlaylistResponse,
  PlaylistsResponse,
  QueueResponse,
  Show,
} from "../types/spotifyAPI";
import { sortObjectKeys } from "../utils/objectUtils";

// A cache is used when multiple requests are made to the same - generally unchanging - data
interface CacheEntry {
  data: any;
  timestamp: number;
}

// A queue is used when multiple requests are made before a response is received
interface QueueEntry {
  promise: Promise<any>;
  timestamp: number;
}

export class SpotifyStore {
  public readonly BASE_URL = "https://api.spotify.com/v1/me/player";
  private authStore: AuthStore;
  private requestCache: Record<string, CacheEntry | undefined> = {};
  private requestQueue: Record<string, QueueEntry | undefined> = {};
  private cacheExpiration = 10 * 500; // 5 seconds default expiration
  private access_token: string | undefined = undefined;
  private rateLimitDelay = 0;

  constructor(authStore: AuthStore) {
    this.authStore = authStore;

    this.authStore.on("accessTokenUpdate", (token) => {
      this.access_token = token.accessToken;
    });
  }

  private async makeRequest(
    method: "get" | "put" | "post" | "delete",
    url: string,
    data: Record<string, any> | null = null,
    options: {
      signal?: AbortSignal;
      forceRefresh?: boolean;
      cacheTime?: number;
      attempt?: number;
    } = {}
  ) {
    // Setup retries
    const retryCount = options.attempt || 0;
    const MAX_RETRIES = 3;

    // Setup the caching
    const cacheKey = `${method}:${url}:${data ? JSON.stringify(sortObjectKeys(data)) : "null"}`;
    const now = Date.now();
    const cacheTime = options.cacheTime ?? this.cacheExpiration;

    // First check if the current request is in the queue
    if (this.requestQueue[cacheKey]) {
      // Check the timestamp to ensure it hasn't expired
      if (this.requestQueue[cacheKey].timestamp + cacheTime > now) {
        DeskThing.sendDebug(
          `SpotifyStore: makeRequest - request already in queue: ${cacheKey}`
        );
        return this.requestQueue[cacheKey].promise;
      } else {
        delete this.requestQueue[cacheKey];
      }
    }

    // Setup error handling
    const internalController = new AbortController();
    const timeoutId = setTimeout(() => internalController.abort(), 30000); // 30 second timeout

    let combinedSignal = internalController.signal;
    if (options.signal) {
      // If external signal aborts, we need to abort too
      const abortListener = () => {
        internalController.abort();
        clearTimeout(timeoutId);
      };
      options.signal.addEventListener("abort", abortListener);

      // Clean up listener when done
      setTimeout(() => {
        options?.signal?.removeEventListener("abort", abortListener);
      }, 0);
    }

    // Then check if the request is in the cache. Only cache requests that are GET requests
    if (
      method === "get" &&
      !options.forceRefresh &&
      this.requestCache[cacheKey] &&
      now - this.requestCache[cacheKey].timestamp < cacheTime
    ) {
      DeskThing.sendDebug(
        `SpotifyStore: makeRequest - using cached data for request: ${cacheKey}`
      );
      return this.requestCache[cacheKey].data;
    }

    // The request promise that gets added to queue
    const requestPromise: Promise<any> = (async () => {
      try {
        // Check if there is an access token
        if (!this.access_token) {
          throw new Error(`Failed to obtain access token`);
        }

        // Setup headers
        const headers = {
          Authorization: `Bearer ${this.access_token}`,
          "Content-Type": "application/json",
        };

        DeskThing.sendDebug(
          "SpotifyStore: makeRequest - making request: " + url
        );

        try {
          // Fetch the url
          const response = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : null,
            signal: combinedSignal,
          });

          clearTimeout(timeoutId); // clear the abort

          // If there is an error
          if (!response.ok) {
            DeskThing.sendDebug(
              `SpotifyStore: makeRequest - request failed: ${response.status} ${response.statusText || "(no status text)"} ${this.getResponseCodeText(response.status)}`
            );
            if (response.status === 401 && retryCount < MAX_RETRIES) {
              await this.authStore.refreshAccessToken();

              DeskThing.sendDebug(
                `SpotifyStore: makeRequest - Token is invalid for request. Adding to queue until there is a new token`
              );

              return this.makeRequest(method, url, data, {
                forceRefresh: true,
                attempt: retryCount + 1,
              });
            }

            if (response.status === 429) {
              const retryAfter = parseInt(
                response.headers.get("Retry-After") || "1",
                10
              );
              this.rateLimitDelay = retryAfter * 1000;
              DeskThing.sendDebug(
                `Rate limited. Waiting ${retryAfter} seconds before retry.`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, this.rateLimitDelay)
              );
              return this.makeRequest(method, url, data, {
                forceRefresh: true,
                attempt: retryCount + 1,
              });
            }
            throw new Error(`Request failed with status ${response.status}`);
          }

          let responseData;
          if (response.status !== 204) {
            // No Content
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              responseData = await response.json();
            } else {
              responseData = await response.text();
              // Try to parse as JSON in case content-type is wrong
              try {
                responseData = JSON.parse(responseData);
              } catch (e) {
                // Keep as text if not valid JSON
              }
            }
          } else {
            DeskThing.sendDebug(
              `SpotifyStore: makeRequest - response is not JSON: ${cacheKey}`
            );
          }

          // Cache the response
          this.requestCache[cacheKey] = {
            data: responseData,
            timestamp: now,
          };

          return responseData;
        } catch (error) {
          clearTimeout(timeoutId); // clear the abort signal

          if (!(error instanceof Error)) {
            DeskThing.sendError(`API request failed: ${error}`);
            return;
          }

          if (error.name == "AbortError") {
            DeskThing.sendDebug(
              `SpotifyStore: makeRequest - request timed out: ${cacheKey}`
            );
            throw new Error("Request timed out after 30 seconds");
          }

          DeskThing.sendError(`API request failed: ${error.message}`);
          // Remove failed requests from cache
          if (this.requestQueue[cacheKey]) {
            delete this.requestQueue[cacheKey];
          }
          throw error;
        }
      } catch {
        // Remove failed requests from cache
        if (this.requestQueue[cacheKey]) {
          delete this.requestQueue[cacheKey];
        }

        // Also delete cache if the cache is from this request
        if (this.requestCache[cacheKey]?.timestamp == now) {
          delete this.requestCache[cacheKey];
        }
      }
    })();

    if (method === "get") {
      this.requestQueue[cacheKey] = {
        promise: requestPromise,
        timestamp: now,
      };
    }

    return requestPromise;
  }

  cleanupCache() {
    const now = Date.now();

    // Clean up expired cache entries
    Object.keys(this.requestCache).forEach((key) => {
      if (
        this.requestCache[key] &&
        now - this.requestCache[key]?.timestamp > this.cacheExpiration
      ) {
        delete this.requestCache[key];
      }
    });

    // Clean up expired queue entries
    Object.keys(this.requestQueue).forEach((key) => {
      if (
        this.requestQueue[key] &&
        now - this.requestQueue[key]?.timestamp > this.cacheExpiration
      ) {
        delete this.requestQueue[key];
      }
    });
  }

  private getResponseCodeText(code: number) {
    switch (code) {
      case 200:
        return "OK";
      case 201:
        return "Created";
      case 202:
        return "Accepted";
      case 204:
        return "No Content";
      case 304:
        return "Not Modified";
      case 400:
        return "Bad Request";
      case 401:
        return "Unauthorized";
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 429:
        return "Too Many Requests";
      case 500:
        return "Internal Server Error";
      case 502:
        return "Bad Gateway";
      case 503:
        return "Service Unavailable";
      default:
        return "Unknown Error";
    }
  }

  async getCurrentPlayback({ signal }: { signal?: AbortSignal } = {}): Promise<
    PlayerResponse | undefined
  > {
    DeskThing.sendDebug("SpotifyStore: getCurrentPlayback");
    const url = `${this.BASE_URL}?additional_types=episode`;
    return this.makeRequest("get", url, undefined, { signal });
  }
  async getPlaylists(limit = 20): Promise<PlaylistsResponse | undefined> {
    const url = `https://api.spotify.com/v1/me/playlists?limit=${limit}`;
    return this.makeRequest("get", url);
  }

  async getPlaylist(
    playlistId: string
  ): Promise<PlaylistResponse | undefined> {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=ES`;
    return this.makeRequest("get", url);
  }


  async getAlbum(albumId: string): Promise<Album | undefined> {
    const url = `https://api.spotify.com/v1/albums/${albumId}`;
    return this.makeRequest("get", url);
  }

  async getArtist(artistId: string): Promise<Artist | undefined> {
    const url = `https://api.spotify.com/v1/artists/${artistId}`;
    return this.makeRequest("get", url);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    const url = `https://api.spotify.com/v1/shows/${showId}`;
    return this.makeRequest("get", url);
  }

  async getLikedTracks() {
    const url = "https://api.spotify.com/v1/me/tracks?limit=1";
    return this.makeRequest("get", url);
  }

  async play(data?: {
    context_uri?: string;
    uris?: string[];
    offset?: { position?: number; uri?: string };
    position_ms?: number;
    device_id?: string;
  }) {
    if (!data) return this.makeRequest("put", `${this.BASE_URL}/play`);

    DeskThing.sendDebug("SpotifyStore: play - data: " + JSON.stringify(data));

    const url = `${this.BASE_URL}/play${data.device_id ? `?device_id=${data.device_id}` : ""}`;
    const { device_id, ...bodyData } = data;
    return this.makeRequest("put", url, bodyData);
  }

  async next() {
    return this.makeRequest("post", `${this.BASE_URL}/next`);
  }

  async previous() {
    return this.makeRequest("post", `${this.BASE_URL}/previous`);
  }

  async pause() {
    return this.makeRequest("put", `${this.BASE_URL}/pause`);
  }

  async seek(position: string | number) {
    return this.makeRequest(
      "put",
      `${this.BASE_URL}/seek?position_ms=${position}`
    );
  }

  async volume(newVol: number) {
    return this.makeRequest(
      "put",
      `${this.BASE_URL}/volume?volume_percent=${newVol}`
    );
  }

  async repeat(state: "context" | "track" | "off") {
    return this.makeRequest("put", `${this.BASE_URL}/repeat?state=${state}`);
  }

  async shuffle(state: boolean) {
    return this.makeRequest("put", `${this.BASE_URL}/shuffle?state=${state}`);
  }

  async addToPlaylist(playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const currentPlayback = await this.getCurrentPlayback();

    if (currentPlayback && currentPlayback.item) {
      const body = { uris: [currentPlayback.item.uri] };
      return this.makeRequest("post", url, body);
    }
  }

  async addToQueue(uri: string) {
    const url = `${this.BASE_URL}/queue?uri=${uri}`;
    return this.makeRequest("post", url);
  }

  async transferPlayback(deviceId: string) {
    const body = { device_ids: [deviceId], play: true };
    return this.makeRequest("put", this.BASE_URL, body);
  }

  async getDevices() {
    return this.makeRequest(
      "get",
      "https://api.spotify.com/v1/me/player/devices"
    );
  }

  async checkLiked(id: string): Promise<boolean[]> {
    if (!id) return [false];
    return this.makeRequest(
      "get",
      `https://api.spotify.com/v1/me/tracks/contains?ids=${id}`
    );
  }

  async likeSong(songId: string, isLiked: boolean) {
    const songURL = `https://api.spotify.com/v1/me/tracks?ids=${songId}`;
    const data = { ids: [songId] };

    if (isLiked) {
      return this.makeRequest("delete", songURL, data);
    } else {
      return this.makeRequest("put", songURL, data);
    }
  }

  async getCurrentQueue({ signal }: { signal?: AbortSignal } = {}): Promise<
    QueueResponse | undefined
  > {
    const url = `${this.BASE_URL}/queue`;
    return this.makeRequest("get", url, undefined, { signal });
  }
}
