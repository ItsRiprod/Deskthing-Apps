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
  private cacheExpiration = 3 * 1000; // 3 seconds default expiration
  private access_token: string | undefined = undefined;
  /**
   * Epoch ms until which every request holds off. Spotify's 429 Retry-After
   * applies to the whole app, not one endpoint, so a single global window is
   * what actually backs us off — without it, the poll loop keeps firing new
   * requests every few seconds, each gets 429'd, and the limit never clears.
   */
  private rateLimitedUntil = 0;
  /** So a multi-minute window logs once, not once per gated poll. */
  private rateLimitLogged = false;

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

    // Dont try anything if not logged in
    if (!this.access_token) {
      return Promise.reject("Not logged in!");
    }

    // Setup retries
    const retryCount = options.attempt || 0;
    const MAX_RETRIES = 3;

    // Setup the caching
    const cacheKey = `${method}:${url}:${data ? JSON.stringify(sortObjectKeys(data)) : "null"}`;
    const now = Date.now();
    const cacheTime = options.cacheTime ?? this.cacheExpiration;

    // First check if the current request is in the queue. A forced refresh
    // must not join it: the caller is asking precisely because it believes the
    // in-flight answer is about to be out of date.
    if (this.requestQueue[cacheKey] && !options.forceRefresh) {
      // Check the timestamp to ensure it hasn't expired
      if (this.requestQueue[cacheKey].timestamp + cacheTime > now) {
        console.debug(
          `SpotifyStore: makeRequest - request already in queue: ${cacheKey}`
        );
        return this.requestQueue[cacheKey].promise;
      } else {
        delete this.requestQueue[cacheKey];
      }
    }

    // Honor a global rate-limit window. While Spotify has told us to back off,
    // don't fire new requests and collect more 429s (which is what keeps the
    // limit tripped); resolve undefined like every other failure here so the
    // ~25 call sites keep their existing contract. Recent cached GETs are still
    // served. Placed after the queue lookup so a request already in flight is
    // joined rather than refused.
    if (now < this.rateLimitedUntil) {
      const entry =
        method === "get" && !options.forceRefresh
          ? this.requestCache[cacheKey]
          : undefined;
      if (entry && now - entry.timestamp < 60_000) return entry.data;
      return undefined;
    } else if (this.rateLimitLogged) {
      this.rateLimitLogged = false;
      console.info("SpotifyStore: rate-limit window cleared; resuming requests");
    }

    // Setup error handling
    const internalController = new AbortController();
    const timeoutId = setTimeout(() => internalController.abort(), 5000); // 5 second timeout

    const combinedSignal = internalController.signal;
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
      }, 150);
    }

    // Then check if the request is in the cache. Only cache requests that are GET requests
    if (
      method === "get" &&
      !options.forceRefresh &&
      this.requestCache[cacheKey] &&
      now - this.requestCache[cacheKey].timestamp < cacheTime
    ) {
      console.debug(
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

        console.debug(
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
            console.debug(
              `SpotifyStore: makeRequest - request failed: ${response.status} ${response.statusText || "(no status text)"} ${this.getResponseCodeText(response.status)}`
            );
            if (response.status === 401 && retryCount < MAX_RETRIES) {
              await this.authStore.refreshAccessToken();

              console.debug(
                `SpotifyStore: makeRequest - Token is invalid for request. Adding to queue until there is a new token`
              );

              return this.makeRequest(method, url, data, {
                forceRefresh: true,
                attempt: retryCount + 1,
              });
            }

            if (response.status === 429) {
              // Open a global window so EVERY request backs off together, not
              // just this one — that is what lets the limit actually clear.
              // Retry-After may be seconds OR an HTTP-date (RFC 7231); a
              // careless parse yields NaN, and `now < NaN` is always false,
              // which would silently disable this entire mechanism.
              const raw = response.headers.get("Retry-After");
              let secs = Number.parseInt(raw ?? "", 10);
              if (!Number.isFinite(secs) || secs <= 0) {
                const asDate = raw ? Date.parse(raw) : NaN;
                secs = Number.isFinite(asDate)
                  ? Math.ceil((asDate - Date.now()) / 1000)
                  : 5;
              }
              if (!Number.isFinite(secs) || secs <= 0) secs = 5;
              // Clamp: Spotify has sent Retry-After values north of 13 hours.
              // One probe per 5 minutes re-arms the window if the ban is truly
              // longer, which beats a silent half-day freeze. Jitter avoids a
              // thundering herd of pollers when the window lapses.
              const MAX_BACKOFF_S = 300;
              const delayMs =
                Math.min(secs, MAX_BACKOFF_S) * 1000 +
                Math.floor(Math.random() * 2000);
              // Math.max: a concurrent 429 with a shorter Retry-After must
              // never shrink an already-open window.
              this.rateLimitedUntil = Math.max(
                this.rateLimitedUntil,
                Date.now() + delayMs
              );
              if (!this.rateLimitLogged) {
                this.rateLimitLogged = true;
                console.warn(
                  `SpotifyStore: rate limited (429). Retry-After=${raw}; backing off all requests for ${Math.round(delayMs / 1000)}s`
                );
              }
              // Resolve undefined (the contract every caller is written
              // against) instead of retrying in place — the gate above lets
              // the next poll through once the window passes.
              return undefined;
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
            console.debug(
              `SpotifyStore: makeRequest - response is not parsable ( status: ${response.status} ${response.statusText} ): ${cacheKey}`
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
            console.error(`API request failed: ${error}`);
            return;
          }

          if (error.name == "AbortError") {
            console.debug(
              `SpotifyStore: makeRequest - request timed out: ${cacheKey}`
            );
            throw new Error("Request timed out after 30 seconds");
          }

          console.error(`API request failed: ${error.message}`);
          // Remove failed requests from cache
          if (this.requestQueue[cacheKey]) {
            delete this.requestQueue[cacheKey];
          }
          throw error;
        }
      } catch (error) {
        // Remove failed requests from cache
        if (this.requestQueue[cacheKey]) {
          delete this.requestQueue[cacheKey];
        }

        // Also delete cache if the cache is from this request
        if (this.requestCache[cacheKey]?.timestamp == now) {
          delete this.requestCache[cacheKey];
        }

        console.warn("SpotifyStore: makeRequest - error", error);
      }
    })();

    if (method === "get") {
      this.requestQueue[cacheKey] = {
        promise: requestPromise,
        timestamp: now,
      };

      // "Already in queue" has to mean "still in flight". Leaving the entry
      // behind after the request settles turned this into a second, hidden
      // cache — one that ignores forceRefresh and hands every later caller the
      // resolved promise carrying the OLD payload for a further 3 seconds.
      //
      // That is what made a track boundary cost two poll cycles instead of
      // one: the refresh at the boundary asks a beat too early and gets the
      // track that just finished, its retries are answered from this stale
      // promise, and the next scheduled poll lands in the same window and is
      // answered from it too — so an entire cycle reports "no change" without
      // ever reaching Spotify.
      //
      // requestCache below is the real cache and still coalesces ordinary
      // rapid GETs, so nothing loses its de-duplication.
      void requestPromise.finally(() => {
        if (this.requestQueue[cacheKey]?.promise === requestPromise) {
          delete this.requestQueue[cacheKey];
        }
      });
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

  private responseCodeMap: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable"
  };

  private getResponseCodeText(code: number): string {
    return this.responseCodeMap[code] || "Unknown Error";
  }

  async getCurrentPlayback({
    signal,
    forceRefresh,
  }: { signal?: AbortSignal; forceRefresh?: boolean } = {}): Promise<
    PlayerResponse | undefined
  > {
    console.debug("SpotifyStore: getCurrentPlayback");
    const url = `${this.BASE_URL}?additional_types=episode`;
    return this.makeRequest("get", url, undefined, { signal, forceRefresh });
  }

  async getPlaylists(start = 0, limit = 20): Promise<PlaylistsResponse | undefined> {
    const url = `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${start}`;
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

    console.debug("SpotifyStore: play - data: " + JSON.stringify(data));

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

  async repeat(state: "off" | "all" | "track" | "context") {
    // Converts the state to the spotify state
    const spotifyState = state === "all" ? "context" : state === "context" ? "context" : state;

    return this.makeRequest("put", `${this.BASE_URL}/repeat?state=${spotifyState}`);
  }

  async shuffle(state: boolean) {
    return this.makeRequest("put", `${this.BASE_URL}/shuffle?state=${state}`);
  }

  async addToPlaylist(playlistId: string, songId?: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    
    if (!songId) {
      const currentPlayback = await this.getCurrentPlayback();

      if (currentPlayback && currentPlayback.item) {
        songId = currentPlayback.item.uri;
      } else {
        console.log(`No song playing, cannot add to playlist`);
        return;
      }
    } else {
      if (!songId.includes('spotify:track:')) {
        songId = `spotify:track:${songId}`;
      }
    }

    console.debug(`Adding ${songId} to playlist ${playlistId}`);

    const body = { uris: [songId] };
    try {
      return this.makeRequest("post", url, body);
    } catch (error) {
      console.error(`Failed to add track ${songId} to playlist: `, error);
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
