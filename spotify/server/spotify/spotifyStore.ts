import { DeskThing } from "@deskthing/server";
import { AuthStore } from "./authStore";
import { PlayerResponse } from "../types/spotifyAPI";

export class SpotifyStore {
  public readonly BASE_URL = "https://api.spotify.com/v1/me/player";
  private authStore: AuthStore;

  constructor(authStore: AuthStore) {
    this.authStore = authStore;
  }

  async makeRequest(
    method: "get" | "put" | "post" | "delete",
    url: string,
    data: any = null
  ) {
    const access_token = this.authStore.getAccessToken();
    if (!access_token) {
      await this.authStore.refreshAccessToken();
    }

    const headers = {
      Authorization: `Bearer ${this.authStore.getAccessToken()}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.authStore.refreshAccessToken();
          return this.makeRequest(method, url, data);
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.json().catch(() => null);
    } catch (error) {
      DeskThing.sendError(`API request failed: ${error}`);
      throw error;
    }
  }

  async getCurrentPlayback(): Promise<PlayerResponse | undefined> {
    const url = `${this.BASE_URL}?additional_types=episode`;
    return this.makeRequest("get", url);
  }

  async getPlaylist(playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=ES`;
    return this.makeRequest("get", url);
  }

  async getLikedTracks() {
    const url = "https://api.spotify.com/v1/me/tracks?limit=1";
    return this.makeRequest("get", url);
  }

  async play(data: {
    context_uri: string;
    offset?: { uri: string };
    position_ms?: number;
  }) {
    const url = `${this.BASE_URL}/play`;
    return this.makeRequest("put", url, data);
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

  async repeat(state: string) {
    const repeatState = state === "all" ? "context" : state;
    return this.makeRequest(
      "put",
      `${this.BASE_URL}/repeat?state=${repeatState}`
    );
  }

  async shuffle(state: string) {
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

  async transferPlayback(deviceId: string) {
    const body = { device_ids: [deviceId], play: true };
    return this.makeRequest("put", this.BASE_URL, body);
  }
}
