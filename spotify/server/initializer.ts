import {
  AUDIO_REQUESTS,
  DESKTHING_EVENTS,
  SocketData,
  SongEvent,
} from "@deskthing/types";
import storeProvider from "./spotify/storeProvider";
import { setupActions } from "./setupActions";
import { setupTasks } from "./setupTasks";
import { setupSettings } from "./setupSettings";
import { createDeskThing } from "@deskthing/server";
import {
  SpotifyEvent,
  ToClientTypes,
  ToServerTypes,
} from "../shared/transitTypes";

const DeskThing = createDeskThing<ToServerTypes, ToClientTypes>();

export const initialize = async () => {
  setupActions();
  setupTasks();
  setupSettings();
};

DeskThing.on(SongEvent.GET, async (data) => {
  const musicStore = storeProvider.getSongStore();

  if (data.type == null) {
    DeskThing.sendError("No args provided!");
    return;
  }

  switch (data.request) {
    case AUDIO_REQUESTS.SONG:
      // Will emit the song back
      musicStore.returnSongData();
      break;
    case AUDIO_REQUESTS.REFRESH:
      await musicStore.checkForRefresh();
      break;
  }
});

DeskThing.on(SpotifyEvent.GET, async (data) => {
  const queueStore = storeProvider.getQueueStore();
  const playlistStore = storeProvider.getPlaylistStore();

  switch (data.request) {
    case "playlists": {
      const playlists = await playlistStore.getAllPlaylists();
      DeskThing.send({
        app: "spotify",
        type: "playlists",
        payload: playlists,
      });
      break;
    }
    case "presets": {
      const presets = await playlistStore.getPresets();
      DeskThing.send({
        app: "spotify",
        type: "presets",
        payload: presets,
      });
      break;
    }
    case "queue":
      const queue = await queueStore.getQueueData();
      if (queue) {
        DeskThing.send({
          app: "spotify",
          type: "queueData",
          payload: queue,
        });
      }
      break;
  }
});

DeskThing.on(SongEvent.SET, async (data) => {
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }

  const actionStore = storeProvider.getActionStore();
  const songStore = storeProvider.getSongStore();
  let response;
  switch (data.request) {
    case AUDIO_REQUESTS.NEXT:
      response = await actionStore.next(data.payload);
      break;
    case AUDIO_REQUESTS.PREVIOUS:
      response = await actionStore.previous();
      break;
    case AUDIO_REQUESTS.FAST_FORWARD:
      response = await actionStore.fastForward(data.payload);
      break;
    case AUDIO_REQUESTS.REWIND:
      response = await actionStore.rewind(data.payload);
      break;
    case AUDIO_REQUESTS.PLAY:
      response = await actionStore.play(data.payload);
      break;
    case AUDIO_REQUESTS.PAUSE:
    case AUDIO_REQUESTS.STOP:
      response = await actionStore.pause();
      break;
    case AUDIO_REQUESTS.SEEK:
      response = await actionStore.seek(data.payload);
      break;
    case AUDIO_REQUESTS.LIKE:
      response = await songStore.likeSong(data.payload);
      break;
    case AUDIO_REQUESTS.VOLUME:
      response = await actionStore.volume(data.payload);
      break;
    case AUDIO_REQUESTS.REPEAT:
      response = await actionStore.repeat(data.payload);
      break;
    case AUDIO_REQUESTS.SHUFFLE:
      response = await actionStore.shuffle(data.payload);
      break;
  }
  DeskThing.sendLog(response);
});

DeskThing.on(SpotifyEvent.SET, async (data) => {
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }

  const actionStore = storeProvider.getActionStore();
  const songStore = storeProvider.getSongStore();
  const playlistStore = storeProvider.getPlaylistStore();
  let response;
  switch (data.request) {
    case "transfer":
      response = await actionStore.transferPlayback(data.payload);
      break;
    case "current_to_preset":
      response = await playlistStore.addCurrentPlaylistToPreset(data.payload);
      break;
    case "preset":
      if (!data.payload.playlistId || !data.payload.presetNum) {
        DeskThing.sendError("No playlistId or presetNum provided");
        return;
      }
      response = await playlistStore.setPreset(data.payload.presetNum, { playlistURI: data.payload.playlistId });
      break;
    case "like_song":
      response = await songStore.likeSong(data.payload);
      break;
  }
  DeskThing.sendLog(response);
});

DeskThing.on(SpotifyEvent.ADD, async (data) => {
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }

  const queueStore = storeProvider.getQueueStore();
  const playlistStore = storeProvider.getPlaylistStore();
  let response;
  switch (data.request) {
    case "current_to_preset": // Expects playlist index
      response = await playlistStore.addCurrentToPreset(data.payload);
      break;
    case "current_to_playlist": // Expects uri
      response = await playlistStore.addCurrentToPlaylist(data.payload);
      break;
    case "queue": // Expects uri
      response = await queueStore.addToQueue(data.payload);
      break;
  }
  DeskThing.sendLog(response);
})

DeskThing.on(SpotifyEvent.PLAY, async (data) => {
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }

  const playlistStore = storeProvider.getPlaylistStore();
  let response;
  switch (data.request) {
    case "playlist": // Expects playlist index
      response = await playlistStore.playPlaylist(data.payload);
      break;
    case "preset": // Expects uri
      response = await playlistStore.playPreset(data.payload);
      break;
  }
  DeskThing.sendLog(response);
})

const handleCallbackData = async (data: SocketData) => {
  if (data.payload == null) {
    DeskThing.sendError("Unable to get access token");
  } else {
    const authStore = storeProvider.getAuthStore();
    try {
      await authStore.getAccessToken(data.payload);
    } catch (error) {
      DeskThing.sendError("Unable to get access token");
    }
  }
};

DeskThing.on(DESKTHING_EVENTS.CALLBACK_DATA, handleCallbackData);
