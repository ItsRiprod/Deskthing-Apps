
import { DeskThing } from "@deskthing/server"
import { Action, ServerEvent } from "@deskthing/types"
import storeProvider from "./spotify/storeProvider"

export enum SpotifyActionIDs {
  SET_PLAYLIST = "set_playlist",
  REFRESH_SONG = "refresh_song",
  CYCLE_KEY = "cycle_key",
  PLAY_PLAYLIST = "play_playlist",
  LIKE_SONG = "like_song"
}

export const setupActions = () => {
  // Set Playlist Action
  const playlistAction: Action = {
    name: "Set Playlist",
    description: "Sets the current playlist to the provided ID",
    id: SpotifyActionIDs.SET_PLAYLIST,
    value: "0",
    value_instructions: "Enter the index of the playlist (1-4) for where to save the current playlist to",
    value_options: ["1", "2", "3", "4"],
    enabled: true,
    version: "0.10.3",
    version_code: 10,
  }
  DeskThing.registerAction(playlistAction)

  // Refresh Song Action
  const refreshAction: Action = {
    name: "Refresh Song",
    description: "Refreshes the current song",
    id: SpotifyActionIDs.REFRESH_SONG,
    enabled: true,
    version: "0.10.3",
    version_code: 10,
  }
  DeskThing.registerAction(refreshAction)

  // Cycle Key Action
  const cycleKeyAction: Action = {
    name: "Cycle Key",
    description: "Cycles the Auth Key",
    id: SpotifyActionIDs.CYCLE_KEY,
    enabled: true,
    version: "0.10.3",
    version_code: 10,
  }
  DeskThing.registerAction(cycleKeyAction)

  // Play Playlist Action
  const playPlaylistAction: Action = {
    name: "Play Playlist",
    description: "Plays the playlist at the index or the provided uri",
    id: SpotifyActionIDs.PLAY_PLAYLIST,
    source: "",
    version: "",
    value: "0",
    value_instructions: "Enter either the index of the playlist (1-4) or the spotify uri of the playlist",
    enabled: true,
    version_code: 10,
  }
  DeskThing.registerAction(playPlaylistAction)

  // Like Song Action
  const likeAction: Action = {
    name: "Like Song",
    description: "Likes the current song. Only works for spotify",
    id: SpotifyActionIDs.LIKE_SONG,
    source: "",
    version: "",
    enabled: false,
    version_code: 10,
  }
  DeskThing.registerAction(likeAction)
}
  DeskThing.on(ServerEvent.ACTION, async (data) => {
    const actionStore = storeProvider.getActionStore()

    await actionStore.handleAction(data.payload)
  })