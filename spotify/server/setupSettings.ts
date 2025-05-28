import { DeskThing } from "@deskthing/server"
import { DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types"
import storeProvider from "./spotify/storeProvider"
import { SpotifySettingIDs } from "../shared/spotifyTypes"

export const setupSettings = () => {
  DeskThing.initSettings({
    [SpotifySettingIDs.CLIENT_ID]: {
      id: SpotifySettingIDs.CLIENT_ID,
      type: SETTING_TYPES.STRING,
      description: "You can get your Spotify Client ID from the Spotify Developer Dashboard. You must create a new application and then under 'Client ID' Copy and paste that into this field.",
      label: "Spotify Client ID",
      value: "",
    },
    [SpotifySettingIDs.CLIENT_SECRET]: {
      id: SpotifySettingIDs.CLIENT_SECRET,
      type: SETTING_TYPES.STRING,
      description: "You can get your Spotify Client Secret from the Spotify Developer Dashboard. You must create a new application and then under 'View Client Secret', Copy and paste that into this field.",
      label: "Spotify Client Secret",
      value: "",
    },
    [SpotifySettingIDs.REDIRECT_URI]: {
      id: SpotifySettingIDs.REDIRECT_URI,
      type: SETTING_TYPES.STRING,
      description: "Set the Spotify Redirect URI to deskthing://a?app=spotify and then click 'Save'",
      label: "Redirect URL",
      value: "deskthing://a?app=spotify",
    },
    [SpotifySettingIDs.CHANGE_SOURCE]: {
      id: SpotifySettingIDs.CHANGE_SOURCE,
      type: SETTING_TYPES.BOOLEAN,
      description: "Switch Output on Select",
      label: "Switch Output on Select",
      value: true,
    },
    [SpotifySettingIDs.OUTPUT_DEVICE]: {
      id: SpotifySettingIDs.OUTPUT_DEVICE,
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
      id: SpotifySettingIDs.TRANSFER_PLAYBACK_ON_ERROR,
      type: SETTING_TYPES.BOOLEAN,
      description: "Transfer Playback on Error",
      label: "Transfer Playback on Error",
      value: true
    },

    // The rest of these aren't used by the server - rather, they are used by the GUI
    [SpotifySettingIDs.BLUR_BACKGROUND_THUMBNAIL]: {
      id: SpotifySettingIDs.BLUR_BACKGROUND_THUMBNAIL,
      type: SETTING_TYPES.BOOLEAN,
      description: "Replace the background color with a blurred thumbnail",
      label: "Blur Background Thumbnail",
      value: false,
    },
    [SpotifySettingIDs.BACKDROP_BLUR_AMNT]: {
      id: SpotifySettingIDs.BACKDROP_BLUR_AMNT,
      type: SETTING_TYPES.NUMBER,
      description: "Blur amount in pixels",
      min: 0,
      max: 100,
      label: "Background Blur Amount",
      value: 10,
    },
    [SpotifySettingIDs.SHOW_CONTROLS]: {
      id: SpotifySettingIDs.SHOW_CONTROLS,
      type: SETTING_TYPES.BOOLEAN,
      description: "Show playback controls",
      label: "Show Controls",
      value: false,
    },
    [SpotifySettingIDs.THUMBNAIL_SIZE]: {
      id: SpotifySettingIDs.THUMBNAIL_SIZE,
      type: SETTING_TYPES.SELECT,
      description: "Thumbnail Size",
      label: "Thumbnail Size",
      value: "small",
      options: [
        {
          value: "hidden",
          label: "Hidden"
        },
        {
          value: "small",
          label: "Small"
        },
        {
          value: "medium",
          label: "Medium"
        },
        {
          value: "large",
          label: "Large"
        }
      ]
    },
    [SpotifySettingIDs.TEXT_SETTING]: {
      id: SpotifySettingIDs.TEXT_SETTING,
      type: SETTING_TYPES.SELECT,
      description: "Text Setting",
      label: "Text Setting",
      value: "normal",
      options: [
        {
          value: "minimal",
          label: "Just Title"
        },
        {
          value: "normal",
          label: "All song info"
        },
        {
          value: "clock",
          label: "Clock"
        }
      ]
    }
  })
}

DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (settingData) => {
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