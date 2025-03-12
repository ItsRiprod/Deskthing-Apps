import { DeskThing } from "@deskthing/server"
import { ServerEvent, SETTING_TYPES } from "@deskthing/types"
import storeProvider from "./spotify/storeProvider"

export enum SpotifySettingIDs {
    CLIENT_ID = "client_id",
    CLIENT_SECRET = "client_secret",
    REDIRECT_URI = "redirect_uri",
    CHANGE_SOURCE = "change_source",
    OUTPUT_DEVICE = "output_device",
    TRANSFER_PLAYBACK_ON_ERROR = "transfer_playback_on_error"
}

export const setupSettings = () => {
    DeskThing.initSettings({
      [SpotifySettingIDs.CLIENT_ID]: {
        type: SETTING_TYPES.STRING,
        description: "You can get your Spotify Client ID from the Spotify Developer Dashboard. You must create a new application and then under 'Client ID' Copy and paste that into this field.",
        label: "Spotify Client ID",
        value: "",
      },
      [SpotifySettingIDs.CLIENT_SECRET]: {
        type: SETTING_TYPES.STRING,
        description: "You can get your Spotify Client Secret from the Spotify Developer Dashboard. You must create a new application and then under 'View Client Secret', Copy and paste that into this field.",
        label: "Spotify Client Secret", 
        value: "",
      },
      [SpotifySettingIDs.REDIRECT_URI]: {
        type: SETTING_TYPES.STRING,
        description: "Set the Spotify Redirect URI to deskthing://a?app=spotify and then click 'Save'",
        label: "Redirect URL",
        value: "deskthing://a?app=spotify",
      },
      [SpotifySettingIDs.CHANGE_SOURCE]: {
        type: SETTING_TYPES.BOOLEAN,
        description: "Switch Output on Select",
        label: "Switch Output on Select",
        value: true,
      },
      [SpotifySettingIDs.OUTPUT_DEVICE]: {
        type: SETTING_TYPES.SELECT,
        description: "Select Output Device",
        label: "Output Device",
        value: "default",
        options: [
          {
            value: "default",
            label: "Default"
          }
        ]
      },
      [SpotifySettingIDs.TRANSFER_PLAYBACK_ON_ERROR]: {
        type: SETTING_TYPES.BOOLEAN,
        description: "Transfer Playback on Error",
        label: "Transfer Playback on Error",
        value: true
      }
    })
}

DeskThing.on(ServerEvent.SETTINGS, async (settingData) => {
    const settings = settingData.payload

    if (!settings) return

    const authStore = storeProvider.getAuthStore()

    Object.entries(settings).forEach(([key, setting]) => {
      if (setting.type === SETTING_TYPES.STRING) {
        switch (key) {
          case SpotifySettingIDs.CLIENT_ID:
            setting.value && authStore.setClientId(setting.value)
            break
          case SpotifySettingIDs.CLIENT_SECRET:
            setting.value && authStore.setClientSecret(setting.value)
            break
          case SpotifySettingIDs.REDIRECT_URI:
            setting.value && authStore.setRedirectUri(setting.value)
            break
        }
      }
    })
})