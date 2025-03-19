import { DeskThing } from "@deskthing/server";
import { Playlist } from "../../shared/spotifyTypes";
import storeProvider from "./storeProvider";
import EventEmitter from "node:events";
import { SpotifyStore } from "./spotifyStore"
import { AuthStore } from "./authStore"
import { getEncodedImage } from "../utils/imageUtils"
import { Context } from "../types/spotifyAPI"

type playlistStoreEvents = {
  playlistsUpdate: [Playlist[]];
  presetsUpdate: [Playlist[]];
  allPlaylistsUpdate: [Playlist[]];
};

export class PlaylistStore extends EventEmitter<playlistStoreEvents> {
  private presetSlots: Playlist[] = [];
  private availablePlaylists: Playlist[] = [];
  private spotifyApi: SpotifyStore;
  private spotifyAuth: AuthStore;

  constructor(spotifyApi: SpotifyStore, spotifyAuth: AuthStore) {
    super();
    this.spotifyAuth = spotifyAuth;
    this.spotifyApi = spotifyApi;

    this.spotifyAuth.on('authUpdate', (data) => {
      if (data.authStatus == true) { 
        this.initializePlaylists();
      }
    })
  }

  private async initializePlaylists() {
    // Set up default placeholder preset slots
    this.presetSlots = [
      this.createEmptyPlaylist(1),
      this.createEmptyPlaylist(2),
      this.createEmptyPlaylist(3),
      this.createEmptyPlaylist(4),
    ];

    // Fetch available playlists from Spotify
    await this.refreshPlaylists();
  }

  async getPresets(): Promise<Playlist[]> {
    return this.presetSlots;
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.availablePlaylists;
  }

  private createEmptyPlaylist(index: number): Playlist {
    return {
      title: `Unset${index}`,
      owner: "Unknown",
      tracks: 0,
      id: "-1",
      index,
      snapshot_id: "",
      uri: "spotify:collection:tracks",
      thumbnail_url: "",
    };
  }

  async addCurrentPlaylistToPreset(playlistIndex: number) {
    if (!this.isValidIndex(playlistIndex)) {
      DeskThing.sendError("Invalid playlist index!");
      return;
    }

    const currentPlayback = await this.spotifyApi.getCurrentPlayback();
    if (!currentPlayback?.context?.uri) {
      DeskThing.sendError("No context uri found!");
      return;
    }

    this.setPreset(playlistIndex, { Context: currentPlayback.context })
  }
  
  async setPreset(index: number, options: { playlistURI?: string; Context?: Context }) {
    if (options.Context && this.isLikedSongsPlaylist(options.Context)) {
      await this.setLikedSongsPlaylist(index - 1);
    } else {
      const uri = options.playlistURI || options.Context?.uri

      if (!uri) {
        DeskThing.sendError("No uri found in options");
        return;
      }

      await this.setRegularPlaylist(
        index - 1,
        uri.includes('spotify:playlist:') ? uri : `spotify:playlist:${uri}`
      );
    }
  
    await this.saveAndUpdatePlaylists();
  }

  async playPlaylist(playlistUri: string) {
    try {
      await this.spotifyApi.play({ context_uri: playlistUri.includes('spotify:playlist:') ? playlistUri : `spotify:playlist:${playlistUri}` });
      DeskThing.sendLog(
        `Successfully started playing playlist: ${playlistUri}`
      );
      await this.refreshPlaylists();
    } catch (error) {
      DeskThing.sendError(`Failed to play playlist: ${error}`);
    }
  }

  async playPreset(index: number) {
    if (!this.isValidIndex(index)) {
      DeskThing.sendError(`Invalid playlist index! ${index}`);
      return;
    }

    const playlist = this.presetSlots[index - 1];
    if (!playlist?.uri) {
      DeskThing.sendError(`Invalid playlist or missing URI at index ${index}`);
      return;
    }

    await this.playPlaylist(playlist.uri);
  }

  async refreshPlaylists() {
    // Refresh preset slots
    await Promise.all(
      this.presetSlots.map(async (playlist, index) => {
        if (playlist.id === "-1") return;

        if (playlist.id === "liked") {
          await this.refreshLikedSongsPlaylist(index);
        } else {
          await this.refreshRegularPlaylist(index, playlist);
        }
      })
    );

    // Refresh available playlists
    const playlistsResponse = await this.spotifyApi.getPlaylists();

    if (!playlistsResponse || playlistsResponse.items.length == 0) {
      DeskThing.sendError("No playlists found!");
      return;
    } else {
      DeskThing.sendDebug(`Got ${playlistsResponse?.items.length} playlists from Spotify`);
    }

    const spotifyPlaylists = playlistsResponse.items

    if (spotifyPlaylists) {
      this.availablePlaylists = await Promise.all(spotifyPlaylists.map(async (playlist, index) => ({
        title: playlist.name,
        owner: playlist.owner.display_name || "Unknown",
        tracks: playlist.tracks.total,
        id: playlist.id,
        uri: playlist.uri,
        index,
        snapshot_id: playlist.snapshot_id,
        thumbnail_url: await getEncodedImage(playlist.images[0]?.url || ""),
      })))
    }

    await this.saveAndUpdatePlaylists();
  }

  private async refreshLikedSongsPlaylist(index: number) {
    const response = await this.spotifyApi.getLikedTracks();

    this.presetSlots[index] = {
      title: "Liked Songs",
      owner: "You",
      tracks: response.total || 0,
      id: "liked",
      index,
      snapshot_id: response.snapshot_id,
      uri: "spotify:collection:tracks",
      thumbnail_url: await getEncodedImage(
        "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
      ),
    };
  }

  private async refreshRegularPlaylist(index: number, playlist: Playlist) {
    const response = await this.spotifyApi.getPlaylist(playlist.id);

    this.presetSlots[index] = {
      title: response.name || "Unknown",
      owner: response.owner.display_name || "Unknown",
      tracks: response.tracks.total || 0,
      id: response.id || "-1",
      index,
      snapshot_id: response.snapshot_id || "",
      uri: response.uri || "spotify:playlist:unknown",
      thumbnail_url:
        playlist.thumbnail_url ||
        (await getEncodedImage(response.images[0]?.url)),
    };
  }

  private async setLikedSongsPlaylist(index: number) {
    const response = await this.spotifyApi.getLikedTracks();

    this.presetSlots[index] = {
      title: "Liked Songs",
      owner: "You",
      tracks: response.total || 0,
      id: "liked",
      index,
      snapshot_id: response.snapshot_id,
      uri: "spotify:collection:tracks",
      thumbnail_url: await getEncodedImage(
        "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
      ),
    };
  }

  private async setRegularPlaylist(index: number, playlistUri: string) {
    const playlistId = playlistUri.split(":")[2];
    const response = await this.spotifyApi.getPlaylist(playlistId);

    this.presetSlots[index] = {
      title: response.name || "Unknown",
      owner: response.owner.display_name || "Unknown",
      tracks: response.tracks.total || 0,
      id: response.id || "-1",
      index,
      snapshot_id: response.snapshot_id || "",
      uri: response.uri || "spotify:playlist:unknown",
      thumbnail_url: await getEncodedImage(
        response.images[0]?.url
      ),
    };
  }

  private async saveAndUpdatePlaylists() {
    await DeskThing.saveData({ presetSlots: this.presetSlots });
    await this.sendPlaylistsToClient();
  }

  private async sendPlaylistsToClient() {
    this.emit('presetsUpdate', this.presetSlots);
    this.emit('playlistsUpdate', this.availablePlaylists);
  }

  async addCurrentToPreset(playlistIndex: number) {
    if (!this.isValidIndex(playlistIndex)) {
      DeskThing.sendError("Invalid playlist index!");
      return;
    }

    const playlist = this.presetSlots[playlistIndex - 1];
    if (!playlist?.uri) {
      DeskThing.sendError(
        "Invalid playlist or missing URI at index " + playlistIndex
      );
      return;
    }

    try {
      await this.spotifyApi.addToPlaylist(playlist.id);
      DeskThing.sendLog(
        "Successfully added track to playlist: " + playlist.title
      );
      await this.refreshPlaylists();
    } catch (error) {
      DeskThing.sendError("Failed to add track to playlist: " + error);
    }
  }

  async addCurrentToPlaylist(playlistId: string) {
    try {
      await this.spotifyApi.addToPlaylist(playlistId);
      DeskThing.sendLog(
        "Successfully added track to playlist: " + playlistId
      );
      await this.refreshPlaylists();
    } catch (error) {
      DeskThing.sendError("Failed to add track to playlist: " + error);
    }
  }

  private isValidIndex(index: number): boolean {
    return index >= 1 && index <= this.presetSlots.length;
  }

  private isLikedSongsPlaylist(context: any): boolean {
    return (
      context.type === "collection" &&
      context.href === "https://api.spotify.com/v1/me/tracks"
    );
  }
}