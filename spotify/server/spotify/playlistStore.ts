import { DeskThing } from "@deskthing/server";
import { Paginated, Playlist } from "../../shared/spotifyTypes";
import EventEmitter from "node:events";
import { SpotifyStore } from "./spotifyStore";
import { AuthStore } from "./authStore";
import { getEncodedImage } from "../utils/imageUtils";
import { Context, PlaylistResponse } from "../types/spotifyAPI";

type playlistStoreEvents = {
  playlistsUpdate: [Paginated<Playlist>];
  presetsUpdate: [Playlist[]];
};

export class PlaylistStore extends EventEmitter<playlistStoreEvents> {
  private presetSlots: Playlist[] = [];
  private availablePlaylists: Playlist[] = [];
  private spotifyApi: SpotifyStore;
  private spotifyAuth: AuthStore;
  private numPlaylists: number = 0;

  constructor(spotifyApi: SpotifyStore, spotifyAuth: AuthStore) {
    super();
    this.spotifyAuth = spotifyAuth;
    this.spotifyApi = spotifyApi;

    this.spotifyAuth.on("authUpdate", (data) => {
      if (data.authStatus == true) {
        this.initializePlaylists();
      }
    });
  }

  private validatePlaylistData(playlist: PlaylistResponse | undefined): boolean {
    if (!playlist) return false;
    if (typeof playlist.id !== 'string') return false;
    return true;
  }

  private getContentType(
    uri: string
  ): "playlist" | "album" | "show" | "artist" | "collection" | "unknown" {
    if (!uri) return "unknown";
    // Handle both URI format and direct ID
    if (uri.includes("spotify:playlist:") || /^[a-zA-Z0-9]{22}$/.test(uri)) return "playlist";
    if (uri.includes("spotify:album:")) return "album";
    if (uri.includes("spotify:show:")) return "show";
    if (uri.includes("spotify:artist:")) return "artist";
    if (uri.includes("spotify:collection:")) return "collection";
    return "unknown";
  }
  private async initializePlaylists() {
    // Set up default placeholder preset slots

    const existingData = await DeskThing.getData()

    const existingPresetSlots = existingData?.presetSlots as Playlist[] | undefined

    if (existingPresetSlots) {
      this.presetSlots = existingPresetSlots
    } else {
      this.presetSlots = Array(4).fill(null).map((_, i) =>
        this.presetSlots[i] || this.createEmptyPlaylist(i)
      );
    }

    // Fetch available playlists from Spotify
    await this.refreshPlaylists();
  }

  async getPresets(): Promise<Playlist[]> {
    if (this.presetSlots && this.presetSlots.length > 0) {
      console.debug(`Using cached presets`);
      return this.presetSlots;
    } else {
      await this.initializePlaylists();
      return this.presetSlots;
    }
  }

  async getAllPlaylists(filter?: {
    startIndex: number;
    limit: number;
  }): Promise<Paginated<Playlist>> {
    if (!filter) {
      if (this.availablePlaylists && this.availablePlaylists.length > 0) {
        console.debug(`Using cached playlists`);
        return {
          items: this.availablePlaylists,
          total: this.availablePlaylists.length,
          limit: this.availablePlaylists.length,
          startIndex: 0,
        };
      } else {
        await this.initializePlaylists();
        return {
          items: this.availablePlaylists,
          total: this.availablePlaylists.length,
          limit: this.availablePlaylists.length,
          startIndex: 0,
        };
      }
    }

    const { startIndex, limit } = filter;

    if (startIndex < 0 || limit <= 0) {
      console.error("Invalid pagination parameters");
      return {
        items: [],
        total: this.availablePlaylists.length,
        limit,
        startIndex,
      };
    }

    // If requested range exceeds cached playlists, fetch more from API
    if (startIndex + limit > this.availablePlaylists.length) {
      await this.refreshPlaylists(startIndex, limit);
    }

    const paginatedItems = this.availablePlaylists.slice(startIndex, startIndex + limit);
    return {
      items: paginatedItems,
      total: this.availablePlaylists.length,
      limit,
      startIndex,
    };
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
      console.error("Invalid playlist index!");
      return;
    }

    try {
      const currentPlayback = await this.spotifyApi.getCurrentPlayback();
      if (!currentPlayback?.context?.uri) {
        console.error("No context uri found!");
        return;
      }

      this.setPreset(playlistIndex, { Context: currentPlayback.context });
    } catch (error) {
      console.error("Error in playPreset:", error);
    }
  }

  async clearPreset(index: number) {
    if (!this.isValidIndex(index)) {
      console.error("Invalid playlist index!");
      return;
    }

    this.presetSlots[index] = this.createEmptyPlaylist(index);
    await this.saveAndUpdatePlaylists();
  }

  async setPreset(
    index: number,
    options: { playlistURI?: string; Context?: Context }
  ) {
    if (options.Context && this.isLikedSongsPlaylist(options.Context)) {
      await this.setLikedSongsPlaylist(index);
      return;
    }

    const uri = options.playlistURI || options.Context?.uri;

    if (!uri) {
      console.error("No uri found in options");
      return;
    }

    const contentType = this.getContentType(uri);

    console.debug(`Setting preset ${index} to ${uri} (${contentType})`);

    switch (contentType) {
      case 'playlist':
        await this.setRegularPlaylist(index, uri);
        break;
      case 'album':
        await this.setAlbumAsPlaylist(index, uri);
        break;
      case 'artist':
        await this.setArtistAsPlaylist(index, uri);
        break;
      case 'show':
        await this.setPodcastAsPlaylist(index, uri);
        break;
      case 'collection':
        await this.setLikedSongsPlaylist(index);
        break;
      default:
        console.error(`Unsupported content type for URI: ${uri}`);
    }

    await this.saveAndUpdatePlaylists();
  }

  async playPlaylist(playlistUri: string) {
    try {
      await this.spotifyApi.play({
        context_uri: playlistUri.includes("spotify:playlist:")
          ? playlistUri
          : `spotify:playlist:${playlistUri}`,
      });
      console.log(
        `Successfully started playing playlist: ${playlistUri}`
      );
      await this.refreshPlaylists();
    } catch (error) {
      console.error(`Failed to play playlist: ${error}`);
    }
  }

  async playPreset(index: number) {
    if (!this.isValidIndex(index)) {
      console.error(`Invalid playlist index! ${index}`);
      return;
    }

    const playlist = this.presetSlots[index];
    if (!playlist?.uri) {
      console.error(`Invalid playlist or missing URI at index ${index}`);
      return;
    }

    await this.playPlaylist(playlist.uri);
  }

  async refreshPlaylists(start?: number, limit?: number) {

    console.debug(`Refreshing playlists`);
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
    )

    try {
      // Refresh available playlists
      const playlistsResponse = await this.spotifyApi.getPlaylists(start, limit);

      if (!playlistsResponse || playlistsResponse.items.length == 0) {
        console.error("No new playlists found!");

        
      } else {
        console.debug(
          `Got ${playlistsResponse?.items.length} playlists from Spotify`
        );
        const spotifyPlaylists = playlistsResponse.items;
        this.numPlaylists = playlistsResponse.total

        if (spotifyPlaylists) {
          const newPlaylists = await Promise.all(
            spotifyPlaylists.map(async (playlist, index) => ({
              title: playlist.name,
              owner: playlist.owner?.display_name || "Unknown",
              tracks: playlist.tracks?.total || 0,
              id: playlist.id,
              uri: playlist.uri,
              index,
              snapshot_id: playlist?.snapshot_id,
              thumbnail_url: await getEncodedImage(playlist.images?.[0]?.url || ""),
            }))
          );

          // merge the new playlists with the existing ones, avoiding duplicates
          const playlistMap = new Map<string, Playlist>();
          [...this.availablePlaylists, ...newPlaylists].forEach((pl) => {
            playlistMap.set(pl.id, pl);
          });
          this.availablePlaylists = Array.from(playlistMap.values());
        }
      }


      await this.saveAndUpdatePlaylists();
    } catch (error) {
      console.error("Error in refreshPlaylists:", error);
    }
  }

  private async refreshLikedSongsPlaylist(index: number) {
    try {

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
    } catch (error) {
      console.error(`Error refreshing liked songs playlist:`, error);
    }
  }

  private async refreshRegularPlaylist(index: number, playlist: Playlist) {
    try {
      const response = await this.spotifyApi.getPlaylist(playlist.id);

      if (!this.validatePlaylistData(response)) {
        console.warn(`Invalid playlist data received for ${playlist.id}`);
        return;
      }

      this.presetSlots[index] = {
        title: response?.name || "Unknown",
        owner: response?.owner.display_name || "Unknown",
        tracks: response?.tracks.total || 0,
        id: response?.id || "-1",
        index,
        snapshot_id: response?.snapshot_id || "",
        uri: response?.uri || "spotify:playlist:unknown",
        thumbnail_url:
          playlist.thumbnail_url || response?.images[0]?.url,
      };
    } catch (error) {
      console.error(`Error refreshing playlist ${playlist.id}:`, error);
    }
  }

  private async setLikedSongsPlaylist(index: number) {
    try {

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
    } catch (error) {
      console.error(`Error setting liked songs playlist:`, error);
    }
  }

  private async setAlbumAsPlaylist(index: number, albumUri: string) {
    try {

      const albumId = albumUri.split(":").pop();
      if (!albumId) {
        throw new Error("Invalid album URI");
      }

      const response = await this.spotifyApi.getAlbum(albumId);

      this.presetSlots[index] = {
        title: response?.name || "Unknown Album",
        owner: response?.artists?.[0]?.name || "Unknown Artist",
        tracks: response?.total_tracks || 0,
        id: response?.id || "-1",
        index,
        snapshot_id: "", // Albums don't have snapshot_id
        uri: albumUri,
        thumbnail_url: await response?.images?.[0]?.url,
      };
    } catch (error) {
      console.error(`Error setting albumURI ${albumUri} to playlist at index ${index}: ${error}`);
    }
  }

  private async setArtistAsPlaylist(index: number, artistUri: string) {
    try {

      const artistId = artistUri.split(":").pop();
      if (!artistId) {
        throw new Error("Invalid artist URI");
      }

      const response = await this.spotifyApi.getArtist(artistId);

      this.presetSlots[index] = {
        title: `${response?.name || "Unknown Artist"}'s Top Tracks`,
        owner: "Spotify",
        tracks: 0, // We don't know how many top tracks until we request them
        id: response?.id || "-1",
        index,
        snapshot_id: "",
        uri: artistUri,
        thumbnail_url: await response?.images?.[0]?.url,
      };
    } catch (error) {
      console.error(`Error setting artistURI ${artistUri} to playlist at index ${index}: ${error}`);
    }
  }

  private async setPodcastAsPlaylist(index: number, showUri: string) {
    try {

      const showId = showUri.split(":").pop();
      if (!showId) {
        throw new Error("Invalid show URI");
      }

      const response = await this.spotifyApi.getShow(showId);

      this.presetSlots[index] = {
        title: response?.name || "Unknown Podcast",
        owner: response?.publisher || "Unknown Publisher",
        tracks: response?.total_episodes || 0,
        id: response?.id || "-1",
        index,
        snapshot_id: "",
        uri: showUri,
        thumbnail_url: await response?.images?.[0]?.url,
      };
    } catch (error) {
      console.error(`Error setting showURI ${showUri} to playlist at index ${index}: ${error}`);
    }
  }

  private async setRegularPlaylist(index: number, playlistUri: string) {
    const playlistId = playlistUri.includes(':') ? playlistUri.split(":")[2] : playlistUri;
    try {
      const response = await this.spotifyApi.getPlaylist(playlistId);

      this.presetSlots[index] = {
        title: response?.name || "Unknown",
        owner: response?.owner.display_name || "Unknown",
        tracks: response?.tracks.total || 0,
        id: response?.id || "-1",
        index,
        snapshot_id: response?.snapshot_id || "",
        uri: response?.uri || "spotify:playlist:unknown",
        thumbnail_url: response?.images[0]?.url || "",
      };
    } catch (error) {
      console.error(`Error refreshing playlist ${playlistId}:`, error);
    }
  }

  private async saveAndUpdatePlaylists() {
    await DeskThing.saveData({ presetSlots: this.presetSlots });
    await this.sendPlaylistsToClient();
  }

  private async sendPlaylistsToClient() {
    this.emit("presetsUpdate", this.presetSlots);
    this.emit("playlistsUpdate", this.getPagniatedPlaylists());
  }

  private getPagniatedPlaylists(): Paginated<Playlist> {
    return {
      items: this.availablePlaylists,
      total: this.numPlaylists,
      limit: this.availablePlaylists.length,
      startIndex: 0,
    };    
  }

  async addCurrentToPreset(playlistIndex: number) {
    if (!this.isValidIndex(playlistIndex)) {
      console.error("Invalid playlist index!");
      return;
    }

    const playlist = this.presetSlots[playlistIndex];
    if (!playlist?.uri) {
      console.error(
        "Invalid playlist or missing URI at index " + playlistIndex
      );
      return;
    }

    try {
      await this.spotifyApi.addToPlaylist(playlist.id);
      console.log(
        "Successfully added track to playlist: " + playlist.title
      );
      await this.refreshPlaylists();
    } catch (error) {
      console.error("Failed to add track to playlist: " + error);
    }
  }

  async addCurrentToPlaylist(playlistId: string) {
    try {
      await this.spotifyApi.addToPlaylist(playlistId);
      console.log("Successfully added track to playlist: " + playlistId);
      await this.refreshPlaylists();
    } catch (error) {
      console.error("Failed to add track to playlist: " + error);
    }
  }

  async addSongToPreset(presetIndex: number, songId: string) {
    if (!this.isValidIndex(presetIndex)) {
      console.error("Invalid preset index!");
      return;
    }

    const playlist = this.presetSlots[presetIndex];
    if (!playlist?.uri) {
      console.error(
        "Invalid playlist or missing URI at index " + presetIndex
      );
      return;
    }

    try {
      await this.spotifyApi.addToPlaylist(playlist.id, songId);
      console.log(
        "Successfully added track to playlist: " + playlist.title
      );
      await this.refreshPlaylists();
    } catch (error) {
      console.error("Failed to add track to playlist: " + error);
    }
  }


  private isValidIndex(index: number): boolean {
    const isValid = index >= 0 && index <= this.presetSlots.length - 1;
    if (!isValid) {
      console.error(`Invalid playlist index! Received: ${index} and there are only ${this.presetSlots.length} preset slots.`);
    }
    return isValid;
  }

  private isLikedSongsPlaylist(context: any): boolean {
    return (
      context.type === "collection" &&
      context.href === "https://api.spotify.com/v1/me/tracks"
    );
  }
}

