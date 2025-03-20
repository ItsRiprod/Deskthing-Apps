import { createDeskThing } from "@deskthing/server";
import { ActionStore } from "./actionStore";
import { SpotifyStore } from "./spotifyStore";
import { SongStore } from "./songStore";
import { PlaylistStore } from "./playlistStore";
import { AuthStore } from "./authStore";
import { ToClientTypes, ToServerTypes } from "../../shared/transitTypes";
import { DeviceStore } from "./deviceStore";
import { SpotifySettingIDs } from "../setupSettings";
import { SEND_TYPES } from "@deskthing/types"

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>();

export class DeskthingStore {
  private songStore: SongStore;
  private playlistStore: PlaylistStore;
  private authStore: AuthStore;
  private deviceStore: DeviceStore;

  constructor(
    songStore: SongStore,
    playlistStore: PlaylistStore,
    authStore: AuthStore,
    deviceStore: DeviceStore
  ) {
    this.songStore = songStore;
    this.deviceStore = deviceStore;
    this.playlistStore = playlistStore;
    this.authStore = authStore;
    this.setup();
  }

  setup() {
    // Listen for song updates
    this.songStore.on("songUpdate", (songData) => {
      DeskThing.sendDebug(
        "deskthingStore: song change detected, sending: " +
          JSON.stringify(songData)
      );
      DeskThing.send({
        app: "client",
        type: SEND_TYPES.SONG,
        payload: songData,
      })
    })

    this.songStore.on("thumbnailUpdate", (thumbnail: string) => {
      DeskThing.send({
        app: "client",
        type: SEND_TYPES.SONG,
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

    this.playlistStore.on("presetsUpdate", (playlists) => {
      DeskThing.send({
        app: "spotify",
        type: "presets",
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

    this.deviceStore.on("devicesListUpdate", (devices) => {
      DeskThing.setSettingOptions(SpotifySettingIDs.OUTPUT_DEVICE, [
        {
          value: "default",
          label: "Default",
        },
        ...devices.map((d) => ({
          value: d.id,
          label: d.name,
        })),
      ]);
    });
  }
}
