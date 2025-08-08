import { DeskThing } from "@deskthing/server";
import { AUDIO_REQUESTS, MusicEventPayloads, SongEvent } from "@deskthing/types";
import { CACPMediaStore } from "./mediaStore";

/**
 * Initialize DeskThing event listeners for CACP
 * Enhanced from SoundCloud app with comprehensive logging
 */
export const initializeListeners = async () => {
  DeskThing.sendLog('🎛️ [CACP-Initializer] Setting up DeskThing event listeners for CACP');
  
  const mediaStore = CACPMediaStore.getInstance();
  
  // Initialize MediaStore (no specific initialization needed for CACP)
  DeskThing.sendLog('✅ [CACP-Initializer] MediaStore instance ready');
};

/**
 * Handle GET requests from DeskThing
 */
DeskThing.on(SongEvent.GET, (data) => {
  const mediaStore = CACPMediaStore.getInstance();
  DeskThing.sendLog(`📡 [CACP-Initializer] GET request received: ${data.request}`);
  
  switch (data.request) {
    case AUDIO_REQUESTS.SONG:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing SONG request');
      mediaStore.handleGetSong();
      break;
    case AUDIO_REQUESTS.REFRESH:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing REFRESH request');
      mediaStore.handleRefresh();
      break;
    default:
      DeskThing.sendWarning(`⚠️ [CACP-Initializer] Unknown GET request: ${data.request}`);
  }
});

/**
 * Handle SET requests from DeskThing
 */
DeskThing.on(SongEvent.SET, (data) => {
  const mediaStore = CACPMediaStore.getInstance();
  DeskThing.sendLog(`📡 [CACP-Initializer] SET request received: ${data.request} payload=${data.payload}`);
  
  switch (data.request) {
    case AUDIO_REQUESTS.FAST_FORWARD:
      DeskThing.sendLog(`📡 [CACP-Initializer] Processing FAST_FORWARD: ${data.payload}ms`);
      mediaStore.handleSeek({ positionMs: data.payload }); // Use seek for fast forward
      break;
    case AUDIO_REQUESTS.LIKE:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing LIKE (not supported)');
      DeskThing.sendWarning('❤️ [CACP] Liking songs is not supported for browser audio');
      break;
    case AUDIO_REQUESTS.NEXT:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing NEXT track');
      mediaStore.handleNext();
      break;
    case AUDIO_REQUESTS.PAUSE:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing PAUSE');
      mediaStore.handlePause();
      break;
    case AUDIO_REQUESTS.PLAY:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing PLAY');
      mediaStore.handlePlay();
      break;
    case AUDIO_REQUESTS.PREVIOUS:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing PREVIOUS track');
      mediaStore.handlePrevious();
      break;
    case AUDIO_REQUESTS.REPEAT:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing REPEAT (not fully supported)');
      mediaStore.handleRepeat();
      break;
    case AUDIO_REQUESTS.REWIND:
      DeskThing.sendLog(`📡 [CACP-Initializer] Processing REWIND: ${data.payload}ms`);
      mediaStore.handleSeek({ positionMs: data.payload }); // Use seek for rewind
      break;
    case AUDIO_REQUESTS.SEEK:
      DeskThing.sendLog(`📡 [CACP-Initializer] Processing SEEK: ${data.payload}ms`);
      mediaStore.handleSeek({ positionMs: data.payload });
      break;
    case AUDIO_REQUESTS.SHUFFLE:
      DeskThing.sendLog(`📡 [CACP-Initializer] Processing SHUFFLE: ${data.payload}`);
      mediaStore.handleShuffle({ shuffle: data.payload });
      break;
    case AUDIO_REQUESTS.STOP:
      DeskThing.sendLog('📡 [CACP-Initializer] Processing STOP');
      mediaStore.handlePause(); // Use pause for stop
      break;
    case AUDIO_REQUESTS.VOLUME:
      DeskThing.sendLog(`📡 [CACP-Initializer] Processing VOLUME: ${data.payload} (not supported)`);
      mediaStore.handleVolume({ volume: data.payload });
      break;
    default:
      DeskThing.sendWarning(`⚠️ [CACP-Initializer] Unknown SET request: ${data.request}`);
  }
});

DeskThing.sendLog('✅ [CACP-Initializer] All DeskThing event listeners initialized successfully');
