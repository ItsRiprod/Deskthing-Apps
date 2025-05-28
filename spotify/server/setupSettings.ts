import { DeskThing } from "@deskthing/server"
import { DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types"
import storeProvider from "./spotify/storeProvider"
import { CONTROL_OPTIONS, DISPLAY_ITEMS, SpotifySettingIDs } from "../shared/spotifyTypes"

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
    [SpotifySettingIDs.DISPLAY_ITEMS]: {
      id: SpotifySettingIDs.DISPLAY_ITEMS,
      type: SETTING_TYPES.MULTISELECT,
      description: "Choose which UI elements to be visible",
      label: "UI Elements",
      value: [DISPLAY_ITEMS.THUMBNAIL, DISPLAY_ITEMS.ALBUM, DISPLAY_ITEMS.TITLE, DISPLAY_ITEMS.ARTISTS],
      options: [
        {
          value: DISPLAY_ITEMS.THUMBNAIL,
          label: 'Thumbnail'
        },
        {
          value: DISPLAY_ITEMS.ALBUM,
          label: 'Album Text'
        },
        {
          value: DISPLAY_ITEMS.TITLE,
          label: 'Song Title'
        },
        {
          value: DISPLAY_ITEMS.ARTISTS,
          label: 'Artists'
        },
        {
          value: DISPLAY_ITEMS.CLOCK,
          label: 'Large Clock'
        },
        {
          value: DISPLAY_ITEMS.MINI_CLOCK,
          label: 'Corner Clock'
        },
        {
          value: DISPLAY_ITEMS.CONTROLS,
          label: 'Playback Controls'
        },
        {
          value: DISPLAY_ITEMS.BACKDROP,
          label: 'Blurred Backdrop'
        }
      ]
    },
    [SpotifySettingIDs.BACKDROP_BLUR_AMOUNT]: {
      id: SpotifySettingIDs.BACKDROP_BLUR_AMOUNT,
      type: SETTING_TYPES.NUMBER,
      description: "Blur amount in pixels",
      min: 0,
      max: 100,
      label: "Background Blur Amount",
      value: 10,
    },
    [SpotifySettingIDs.CONTROL_OPTIONS]: {
      id: SpotifySettingIDs.CONTROL_OPTIONS,
      type: SETTING_TYPES.SELECT,
      description: "Playback Control Options",
      label: "Control Options",
      value: 'disabled',
      options: [
        {
          value: CONTROL_OPTIONS.DISABLED,
          label: 'Disabled'
        },
        {
          value: CONTROL_OPTIONS.BOTTOM,
          label: 'Bottom Center'
        },
        {
          value: CONTROL_OPTIONS.UNDER,
          label: 'Under Words'
        },
        {
          value: CONTROL_OPTIONS.THUMBNAIL,
          label: 'In Thumbnail'
        }
      ]
    },
    [SpotifySettingIDs.TEXT_JUSTIFICATION]: {
      id: SpotifySettingIDs.TEXT_JUSTIFICATION,
      type: SETTING_TYPES.SELECT,
      description: "Text Justification",
      label: "Text Justification",
      value: 'left',
      options: [
        {
          value: 'left',
          label: 'Left'
        },
        {
          value: 'center',
          label: 'Center'
        },
        {
          value: 'right',
          label: 'Right'
        }
      ]
    },
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