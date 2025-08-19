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
  await setupSettings();
  await setupActions();
  await setupTasks();
};

DeskThing.on(SongEvent.GET, async (data) => {
  const musicStore = storeProvider.getSongStore();

  if (data.type == null) {
    console.error("No args provided!");
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

  console.debug(`Received spotify GET event for ${data?.request || "unknown"}`);

  switch (data.request) {
    case "playlists": {
      const playlists = await playlistStore.getAllPlaylists();
      console.debug(`Sending ${playlists.length} playlists`);
      DeskThing.send({
        app: "spotify",
        type: "playlists",
        payload: playlists,
      });
      break;
    }
    case "presets": {
      const presets = await playlistStore.getPresets();
      console.debug(`Sending ${presets.length} presets`);
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
        console.debug(`Sending ${queue?.queue?.length} queue items`);
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
    console.error("No args provided");
    return;
  }

  console.debug(`Received song SET event for ${data?.request || "unknown"}`);

  try {

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
    console.log(response);
  } catch (error) {
    console.error(`Error handling set request ${data?.request || "unknown"}:`, error);
  }
});

DeskThing.on(SpotifyEvent.SET, async (data) => {
  if (data == null) {
    console.error("No args provided");
    return;
  }

  try {
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
      case "remove_preset":
        response = await playlistStore.clearPreset(data.payload);
        break;
      case "preset":
        if (!data.payload.playlistId || data.payload.presetNum == undefined) {
          console.error("No playlistId or presetNum provided");
          return;
        }
        response = await playlistStore.setPreset(data.payload.presetNum, { playlistURI: data.payload.playlistId });
        break;
      case "like_song":
        response = await songStore.likeSong(data.payload);
        break;
    }
    console.log(response);
  } catch (error) {
    console.error(`Error handling SET request: ${data?.request || "unknown"}:`, error);
  }
});

DeskThing.on(SpotifyEvent.ADD, async (data) => {
  if (data == null) {
    console.error("No args provided");
    return;
  }

  try {


    console.debug(`Received ADD event for ${data?.request || "unknown"}`);

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
      case "song_to_preset": // Expects uri
        response = await playlistStore.addSongToPreset(data.payload.presetNum, data.payload.songId);
        break;
      case "queue": // Expects uri
        response = await queueStore.addToQueue(data.payload);
        break;
    }
    console.log(response);
  } catch (error) {
    console.error(`Error handling ADD request: ${data?.request || "unknown"}:`, error);
  }
})

DeskThing.on(SpotifyEvent.PLAY, async (data) => {
  if (data == null) {
    console.error("No args provided");
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
  console.log(response);
})

const handleCallbackData = async (data: SocketData) => {
  if (data.payload == null) {
    console.error("Unable to get access token (payload is null)");
  } else {
    const authStore = storeProvider.getAuthStore();
    try {
      await authStore.getAccessToken(data.payload);
    } catch (error) {
      console.error("Unable to get access token", error);
    }
  }
};

DeskThing.on(DESKTHING_EVENTS.STOP, () => {
  const spotifyStore = storeProvider.getSpotifyApi();
  spotifyStore.cleanupCache();
})

DeskThing.on(DESKTHING_EVENTS.CALLBACK_DATA, handleCallbackData);
