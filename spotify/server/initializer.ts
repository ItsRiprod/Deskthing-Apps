import { DeskThing } from "@deskthing/server";
import { ServerEvent, SocketData } from "@deskthing/types";
import storeProvider from "./spotify/storeProvider";
import { setupActions } from "./setupActions";
import { setupTasks } from "./setupTasks";
import { setupSettings } from "./setupSettings";

export const initialize = async () => {
  setupActions();
  setupTasks();
  setupSettings();
};

const handleCallbackData = async (data: SocketData) => {
  if (data.payload == null) {
    DeskThing.sendError("Unable to get access token");
  } else {
    const authStore = storeProvider.getAuthStore();
    await authStore.getAccessToken(data.payload);
  }
};

const handleGet = async (data: SocketData) => {
  const musicStore = storeProvider.getSongStore();
  const playlistStore = storeProvider.getPlaylistStore();

  if (data.type == null) {
    DeskThing.sendError("No args provided!");
    return;
  }
  switch (data.request) {
    case "song":
      const songData = await musicStore.returnSongData();
      DeskThing.send({
        app: "client",
        type: "song",
        payload: songData,
      });
      break;
    case "refresh":
      await musicStore.checkForRefresh();
      break;
    case "playlists":
      const playlists = await playlistStore.getPlaylists();
      DeskThing.send({
        app: "spotify",
        type: "playlists",
        payload: playlists,
      });
      break;
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`);
      break;
    // Handle other types ?
  }
}

const handleSet = async (data: SocketData) => {
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }

  const actionStore = storeProvider.getActionStore();
  const songStore = storeProvider.getSongStore();
  const playlistStore = storeProvider.getPlaylistStore();
  let response;
  switch (data.request) {
    case "next":
      response = await actionStore.next(data.payload);
      break;
    case "previous":
      response = await actionStore.previous();
      break;
    case "fast_forward":
      response = await actionStore.fastForward(data.payload);
      break;
    case "rewind":
      response = await actionStore.rewind(data.payload);
      break;
    case "play":
      response = await actionStore.play(data.payload);
      break;
    case "pause":
    case "stop":
      response = await actionStore.pause();
      break;
    case "seek":
      response = await actionStore.seek(data.payload);
      break;
    case "like":
      response = await songStore.likeSong(data.payload);
      break;
    case "volume":
      response = await actionStore.volume(data.payload);
      break;
    case "repeat":
      response = await actionStore.repeat(data.payload);
      break;
    case "shuffle":
      response = await actionStore.shuffle(data.payload);
      break;
    case "transfer":
      response = await actionStore.transferPlayback(data.payload);
      break;
    case "play_playlist": // Expects playlist index
      response = await playlistStore.playPlaylist(data.payload);
      break;
    case "set_playlist": // Expects playlist index
      response = await playlistStore.setPlaylist(data.payload);
      break;
    case "add_playlist": // Expects playlist index
      response = await playlistStore.addToPlaylist(data.payload);
      break;
  }
  DeskThing.sendLog(response);
};

DeskThing.on(ServerEvent.GET, handleGet);
DeskThing.on(ServerEvent.SET, handleSet);
DeskThing.on(ServerEvent.CALLBACK_DATA, handleCallbackData);
