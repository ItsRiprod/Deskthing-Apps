import { DeskThing } from "@deskthing/server";
import { AuthStore } from "./authStore";
import { PlayerResponse, PlaylistResponse, QueueResponse } from "../types/spotifyAPI";

interface CacheEntry {
  promise: Promise<any>;
  timestamp: number;
}

export class SpotifyStore {
  public readonly BASE_URL = "https://api.spotify.com/v1/me/player";
  private authStore: AuthStore;
  private requestCache: { [key: string]: CacheEntry | undefined } = {};
  private cacheExpiration = 10 * 1000; // 10 seconds default expiration
  private pendingAuth: Promise<string | undefined> | null = null;

  constructor(authStore: AuthStore) {
    this.authStore = authStore;
  }

  private async makeRequest(
    method: "get" | "put" | "post" | "delete",
    url: string,
    data: any = null,
    options: { forceRefresh?: boolean; cacheTime?: number } = {}
  ) {
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
    const now = Date.now();
    const cacheTime = options.cacheTime ?? this.cacheExpiration;

    // Use cache for GET requests if not forcing refresh and cache is valid
    if (
      method === "get" &&
      !options.forceRefresh &&
      this.requestCache[cacheKey] &&
      now - this.requestCache[cacheKey]!.timestamp < cacheTime
    ) {
      DeskThing.sendDebug("SpotifyStore: makeRequest - using cached request");
      return this.requestCache[cacheKey]!.promise;
    }

    const getAuthToken = async () => {
      if (!this.pendingAuth) {
        this.pendingAuth = this.ensureValidToken();
      }
      DeskThing.sendDebug('SpotifyStore: makeRequest - waiting for auth token...');
      const token = await this.pendingAuth;
      this.pendingAuth = null;
      return token;
    };

    const requestPromise = (async () => {
      const access_token = await getAuthToken();
      if (!access_token) {
        throw new Error(
          `Failed to obtain access token | ${this.pendingAuth ? " Pending Auth" : "Auth Resolved"}`
        );
      }
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      DeskThing.sendDebug("SpotifyStore: makeRequest - making request: " + url);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : null,
        });

        if (!response.ok) {
          if (response.status === 401) {
            this.pendingAuth = null;
            return this.makeRequest(method, url, data, { forceRefresh: true });
          }
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json().catch(() => null);
      } catch (error) {
        DeskThing.sendError(`API request failed: ${error}`);
        // Remove failed requests from cache
        if (this.requestCache[cacheKey]) {
          delete this.requestCache[cacheKey];
        }
        throw error;
      }
    })();

    if (method === "get") {
      this.requestCache[cacheKey] = {
        promise: requestPromise,
        timestamp: now,
      };
    }

    return requestPromise;
  }

  private async ensureValidToken(): Promise<string | undefined> {
    let token = await this.authStore.getAccessToken();
    if (!token) {
      try {
        DeskThing.sendDebug('SpotifyStore: ensureValidToken - refreshing token...');
        await this.authStore.refreshAccessToken();
        token = await this.authStore.getAccessToken();
      } catch (error) {
        DeskThing.sendError(`Failed to refresh token: ${error}`);
      }
    }
    DeskThing.sendDebug('SpotifyStore: ensureValidToken - token refreshed');
    return token;
  }

  async getCurrentPlayback(): Promise<PlayerResponse | undefined> {
    DeskThing.sendDebug("SpotifyStore: getCurrentPlayback");
    const url = `${this.BASE_URL}?additional_types=episode`;
    return this.makeRequest("get", url)
  }

  async getPlaylist(playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=ES`;
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

    DeskThing.sendDebug('SpotifyStore: play - data: ' + JSON.stringify(data));

    const url = `${this.BASE_URL}/play${data.device_id ? `?device_id=${data.device_id}` : ''}`;
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
    return this.makeRequest("get", "https://api.spotify.com/v1/me/player/devices");
  }

  async checkLiked(id: string): Promise<boolean[]> {
    if (!id) return [false];
    return this.makeRequest("get", `https://api.spotify.com/v1/me/tracks/contains?ids=${id}`);
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

  async getCurrentQueue(): Promise<QueueResponse | undefined> {
    const url = `${this.BASE_URL}/queue`;
    return this.makeRequest("get", url);
  }

  async getPlaylists(): Promise<PlaylistResponse[] | undefined> {
    const url = `https://api.spotify.com/v1/me/playlists`;
    return this.makeRequest("get", url);
  }
}