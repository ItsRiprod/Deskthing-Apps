import { DeskThing } from "@deskthing/server";
import { ActionStore } from "./actionStore";
import { SpotifyStore } from "./spotifyStore";
import { SongStore } from "./songStore";
import { PlaylistStore } from "./playlistStore";
import { AuthStore } from "./authStore";
import { SpotifySongData } from "@shared/spotifyTypes";

export class DeskthingStore {
  private actionStore: ActionStore;
  private SpotifyStore: SpotifyStore;
  private songStore: SongStore;
  private playlistStore: PlaylistStore;
  private authStore: AuthStore;

  constructor(
    actionStore: ActionStore,
    spotifyApi: SpotifyStore,
    songStore: SongStore,
    playlistStore: PlaylistStore,
    authStore: AuthStore
  ) {
    this.actionStore = actionStore;
    this.SpotifyStore = spotifyApi;
    this.songStore = songStore;
    this.playlistStore = playlistStore;
    this.authStore = authStore;
    this.setup();
  }

  setup() {
    // Listen for song updates
    this.songStore.on("songUpdate", (songData: Partial<SpotifySongData>) => {
      DeskThing.send({
        app: "client",
        type: "song",
        payload: songData,
      });
    });

    this.songStore.on("thumbnailUpdate", (thumbnail: string) => {
      DeskThing.send({
        app: "client",
        type: "song",
        payload: { thumbnail },
      });
    });

    // Listen for playlist updates
    this.playlistStore.on("playlistsUpdate", (playlists) => {
      DeskThing.send({
        app: "spotify",
        type: "playlists",
        payload: playlists,
      });
    });

    // Listen for auth updates
    this.authStore.on("authUpdate", (authData) => {
      DeskThing.send({
        app: "spotify",
        type: "auth",
        payload: authData,
      });
    });

    // Listen for icon updates
    this.songStore.on("iconUpdate", (data: { id: string; state: string }) => {
      DeskThing.updateIcon(data.id, data.state);
    });

    // Listen for device updates
    this.songStore.on("deviceUpdate", (device) => {
      DeskThing.send({
        app: "spotify",
        type: "device",
        payload: device,
      });
    });
  }

  async initialize() {
    try {
      await this.playlistStore.initializePlaylists();
      await this.songStore.checkForRefresh();
    } catch (error) {
      DeskThing.sendError(`Failed to initialize DeskthingStore: ${error}`);
    }
  }
}
