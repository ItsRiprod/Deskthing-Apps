import { DeskThing } from "@deskthing/server";
import { playlist } from "@shared/spotifyTypes";
import { SpotifyStore } from "./spotifyStore";
import EventEmitter from "node:events";

type playlistStoreEvents = {
  playlistsUpdate: [playlist[]];
};

export class PlaylistStore extends EventEmitter<playlistStoreEvents> {
  private playlists: playlist[] = [];
  private spotifyApi: SpotifyStore;

  constructor(spotifyApi: SpotifyStore) {
    super();
    this.spotifyApi = spotifyApi;
  }

  async initializePlaylists() {
    // Set up default placeholder playlists
    this.playlists = [
      this.createEmptyPlaylist(1),
      this.createEmptyPlaylist(2),
      this.createEmptyPlaylist(3),
      this.createEmptyPlaylist(4),
    ];

    await DeskThing.saveData({ playlists: this.playlists });
    await this.sendPlaylistsToClient();
    this.emit("playlistsUpdate", this.playlists);
  }

  async getPlaylists() {
    return this.playlists;
  }

  private createEmptyPlaylist(index: number): playlist {
    return {
      title: `Unset${index}`,
      owner: "Unknown",
      tracks: 0,
      id: "-1",
      uri: "spotify:collection:tracks",
      color: "0000000",
      thumbnail_url: "",
    };
  }

  async setPlaylist(playlistIndex: number) {
    if (!this.isValidIndex(playlistIndex)) {
      DeskThing.sendError("Invalid playlist index!");
      return;
    }

    const currentPlayback = await this.spotifyApi.getCurrentPlayback();
    if (!currentPlayback?.context?.uri) {
      DeskThing.sendError("No context uri found!");
      return;
    }

    if (this.isLikedSongsPlaylist(currentPlayback.context)) {
      await this.setLikedSongsPlaylist(playlistIndex - 1);
    } else {
      await this.setRegularPlaylist(
        playlistIndex - 1,
        currentPlayback.context.uri
      );
    }

    await this.saveAndUpdatePlaylists();
  }

  async playPlaylist(playlistUri: string) {
    try {
      await this.spotifyApi.play({ context_uri: playlistUri });
      DeskThing.sendLog(
        `Successfully started playing playlist: ${playlistUri}`
      );
      await this.refreshPlaylists();
    } catch (error) {
      DeskThing.sendError(`Failed to play playlist: ${error}`);
    }
  }

  async playPlaylistByIndex(index: number) {
    if (!this.isValidIndex(index)) {
      DeskThing.sendError(`Invalid playlist index! ${index}`);
      return;
    }

    const playlist = this.playlists[index - 1];
    if (!playlist?.uri) {
      DeskThing.sendError(`Invalid playlist or missing URI at index ${index}`);
      return;
    }

    await this.playPlaylist(playlist.uri);
  }

  async refreshPlaylists() {
    await Promise.all(
      this.playlists.map(async (playlist, index) => {
        if (playlist.id === "-1") return;

        if (playlist.id === "liked") {
          await this.refreshLikedSongsPlaylist(index);
        } else {
          await this.refreshRegularPlaylist(index, playlist);
        }
      })
    );

    await this.saveAndUpdatePlaylists();
  }

  private async refreshLikedSongsPlaylist(index: number) {
    const response = await this.spotifyApi.getLikedTracks();

    this.playlists[index] = {
      title: "Liked Songs",
      owner: "You",
      tracks: response.total || 0,
      id: "liked",
      uri: "spotify:collection:tracks",
      color: "1DB954",
      thumbnail_url: await DeskThing.encodeImageFromUrl(
        "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
      ),
    };
  }

  private async refreshRegularPlaylist(index: number, playlist: playlist) {
    const response = await this.spotifyApi.getPlaylist(playlist.id);

    this.playlists[index] = {
      title: response.name || "Unknown",
      owner: response.owner.display_name || "Unknown",
      tracks: response.tracks.total || 0,
      id: response.id || "-1",
      uri: response.uri || "spotify:playlist:unknown",
      color: response.primary_color || null,
      thumbnail_url:
        playlist.thumbnail_url ||
        (await DeskThing.encodeImageFromUrl(response.images[0]?.url)),
    };
  }

  private async setLikedSongsPlaylist(index: number) {
    const response = await this.spotifyApi.getLikedTracks();

    this.playlists[index] = {
      title: "Liked Songs",
      owner: "You",
      tracks: response.total || 0,
      id: "liked",
      uri: "spotify:collection:tracks",
      color: "1DB954",
      thumbnail_url: await DeskThing.encodeImageFromUrl(
        "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
      ),
    };
  }

  private async setRegularPlaylist(index: number, playlistUri: string) {
    const playlistId = playlistUri.split(":")[2];
    const response = await this.spotifyApi.getPlaylist(playlistId);

    this.playlists[index] = {
      title: response.name || "Unknown",
      owner: response.owner.display_name || "Unknown",
      tracks: response.tracks.total || 0,
      id: response.id || "-1",
      uri: response.uri || "spotify:playlist:unknown",
      color: response.primary_color || null,
      thumbnail_url: await DeskThing.encodeImageFromUrl(
        response.images[0]?.url
      ),
    };
  }

  private async saveAndUpdatePlaylists() {
    await DeskThing.saveData({ playlists: this.playlists });
    await this.sendPlaylistsToClient();
    this.emit("playlistsUpdate", this.playlists);
  }

  private async sendPlaylistsToClient() {
    DeskThing.send({
      app: "spotify",
      type: "playlists",
      payload: this.playlists,
    });
  }

  async addToPlaylist(playlistIndex: number) {
    if (!this.isValidIndex(playlistIndex)) {
      DeskThing.sendError("Invalid playlist index!");
      return;
    }

    const playlist = this.playlists[playlistIndex - 1];
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

  private isValidIndex(index: number): boolean {
    return index >= 1 && index <= this.playlists.length;
  }

  private isLikedSongsPlaylist(context: any): boolean {
    return (
      context.type === "collection" &&
      context.href === "https://api.spotify.com/v1/me/tracks"
    );
  }
}
