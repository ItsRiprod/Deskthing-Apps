import { createDeskThing } from "@deskthing/server";
import { ActionStore } from "./actionStore";
import { SpotifyStore } from "./spotifyStore";
import { SongStore } from "./songStore";
import { PlaylistStore } from "./playlistStore";
import { AuthStore } from "./authStore";
import { ToClientTypes, ToServerTypes } from "../../shared/transitTypes";
import { DeviceStore } from "./deviceStore";
import { SpotifySettingIDs } from "../../shared/spotifyTypes";
import { APP_REQUESTS } from "@deskthing/types"
import { SessionStore } from "./sessionStore";

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>();

export class DeskthingStore {

  constructor(
    private songStore: SongStore,
    private playlistStore: PlaylistStore,
    private authStore: AuthStore,
    private deviceStore: DeviceStore,
    private sessionStore: SessionStore
  ) {
    this.setup();
  }

  setup() {
    // Listen for song updates
    this.songStore.on("songUpdate", (songData) => {

      console.debug(
        "deskthingStore: song change detected, sending: " +
        JSON.stringify(songData)
      );
      DeskThing.send({
        app: "client",
        type: APP_REQUESTS.SONG,
        payload: songData,
      })
      DeskThing.sendSong(songData)
    })

    this.songStore.on("thumbnailUpdate", (thumbnail: string) => {
      DeskThing.send({
        app: "client",
        type: APP_REQUESTS.SONG,
        payload: { thumbnail },
      });
    });

    // Listen for playlist updates
    this.playlistStore.on("playlistsUpdate", (playlists) => {
      if (!this.sessionStore.hasOpenClients()) return
      DeskThing.send({
        app: "spotify",
        type: "playlists",
        payload: playlists,
      });
    });

    this.playlistStore.on("presetsUpdate", (playlists) => {
      if (!this.sessionStore.hasOpenClients()) return
      DeskThing.send({
        app: "spotify",
        type: "presets",
        payload: playlists,
      });
    });

    // Listen for auth updates
    this.authStore.on("authUpdate", (authData) => {
      if (!this.sessionStore.hasOpenClients()) return
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
      if (!this.sessionStore.hasOpenClients()) return
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
      if (!this.sessionStore.hasOpenClients()) return

      DeskThing.send({
        app: "spotify",
        type: "deviceList",
        payload: devices,
      });
    });


  }
}
