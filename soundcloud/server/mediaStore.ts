import { DeskThing } from "@deskthing/server"
import { SongAbilities, SongData } from "@deskthing/types";
import { NowPlaying } from "./nowplayingWrapper";
import type { NowPlayingMessage, NowPlaying as NowPlayingType } from "node-nowplaying";
import { saveImage } from "./imageUtils";
import type { WebSocket } from 'ws';

/**
 * Chrome Extension Message Types
 */
interface ExtensionMediaData {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying?: boolean;
  isPaused?: boolean;
}

interface ExtensionMessage {
  type: 'mediaData' | 'timeupdate' | 'connection' | 'command-result';
  data?: ExtensionMediaData;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  source?: string;
  version?: string;
  action?: string;
  success?: boolean;
}

export class MediaStore {
  private static instance: MediaStore;
  private player: NowPlayingType & { refresh?: () => Promise<void> };
  private nowPlayingInfo: NowPlayingMessage | undefined = undefined;
  private availableSources: string[] = [];

  // Chrome Extension Integration
  private extensionData: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
    isPlaying?: boolean;
    position?: number;
    duration?: number;
    lastUpdate?: number;
  } = {};
  private useExtensionData = false; // Flag to determine data source
  private extensionWebSocket: WebSocket | null = null; // Store WebSocket connection for sending commands

  private isSubscribed = false

  private constructor() {
    this.player = NowPlaying(this.handleMessage.bind(this));
  }

  public initializeListeners = async () => {
    if (!this.isSubscribed) {
      await this.player.subscribe();
      this.isSubscribed = true
    }
  }

  /**
   * Store WebSocket connection for sending commands to extension
   */
  public setExtensionWebSocket(ws: WebSocket) {
    console.log('🔗 [MediaStore] Setting extension WebSocket connection for control commands');
    this.extensionWebSocket = ws;
    
    ws.on('close', () => {
      console.log('🔗 [MediaStore] Extension WebSocket connection closed');
      this.extensionWebSocket = null;
    });
  }

  /**
   * Send command to Chrome extension via WebSocket
   */
  private sendCommandToExtension(action: string) {
    if (!this.extensionWebSocket) {
      if (action === 'previoustrack' || action === 'nexttrack') {
        console.error('❌ [PREV/NEXT] No extension WebSocket connection available for command:', action);
      }
      return;
    }

    const command = {
      type: 'media-command',
      action: action,
      timestamp: Date.now(),
      id: Date.now()
    };

    // Only log prev/next commands in detail
    if (action === 'previoustrack' || action === 'nexttrack') {
      console.log(`🎮 [PREV/NEXT] Sending command to extension: ${action}`);
      console.log(`📋 [PREV/NEXT] Command payload:`, JSON.stringify(command, null, 2));
    }
    
    try {
      this.extensionWebSocket.send(JSON.stringify(command));
      if (action === 'previoustrack' || action === 'nexttrack') {
        console.log(`✅ [PREV/NEXT] Command sent successfully: ${action}`);
      }
    } catch (error) {
      if (action === 'previoustrack' || action === 'nexttrack') {
        console.error(`❌ [PREV/NEXT] Failed to send command ${action}:`, error);
      }
    }
  }

  /**
   * Handle Chrome Extension WebSocket messages
   */
  public handleExtensionMessage(message: ExtensionMessage) {
    try {      
      switch (message.type) {
        case 'connection':
          console.log(`🔗 [WebSocket] Extension connected: ${message.source} v${message.version}`);
          break;
          
        case 'mediaData':
          if (message.data) {
            // Update media metadata
            if (message.data.title !== undefined) this.extensionData.title = message.data.title;
            if (message.data.artist !== undefined) this.extensionData.artist = message.data.artist;
            if (message.data.album !== undefined) this.extensionData.album = message.data.album;
            if (message.data.artwork !== undefined) this.extensionData.artwork = message.data.artwork;
            if (message.data.isPlaying !== undefined) this.extensionData.isPlaying = message.data.isPlaying;
            
            this.extensionData.lastUpdate = Date.now();
            this.useExtensionData = true; // Switch to extension as primary source
            
            this.sendExtensionDataToDeskThing();
          }
          break;
          
        case 'timeupdate':
          // Update timing information
          if (message.currentTime !== undefined) this.extensionData.position = message.currentTime;
          if (message.duration !== undefined) this.extensionData.duration = message.duration;
          if (message.isPlaying !== undefined) this.extensionData.isPlaying = message.isPlaying;
          
          this.extensionData.lastUpdate = Date.now();
          this.useExtensionData = true; // Switch to extension as primary source
          
          this.sendExtensionDataToDeskThing();
          break;
          
        case 'command-result':
          // Only log prev/next command results
          if (message.action === 'previoustrack' || message.action === 'nexttrack') {
            console.log(`✅ [PREV/NEXT] Extension command result for ${message.action}: ${message.success ? 'SUCCESS' : 'FAILED'}`);
            if (!message.success) {
              console.error(`❌ [PREV/NEXT] Command ${message.action} failed on extension side`);
            }
          }
          break;
          
        default:
          console.log(`⚠️ [WebSocket] Unknown extension message type: ${message.type}`);
      }
      
    } catch (error) {
      console.error(`❌ [MediaStore] Error processing extension message:`, error);
    }
  }

  /**
   * Send Chrome Extension data to DeskThing in the expected format
   */
  private sendExtensionDataToDeskThing() {
    if (!this.extensionData.title && !this.extensionData.artist) {
      return; // No meaningful data to send
    }

    const musicPayload: SongData = {
      version: 2,
      album: this.extensionData.album || null,
      artist: this.extensionData.artist || null,
      playlist: null,
      playlist_id: null,
      track_name: this.extensionData.title || 'Unknown Track',
      shuffle_state: null,
      repeat_state: "off",
      is_playing: this.extensionData.isPlaying || false,
      abilities: [SongAbilities.NEXT, SongAbilities.PREVIOUS, SongAbilities.PLAY, SongAbilities.PAUSE], // Chrome extension control abilities
      track_duration: this.extensionData.duration ? Math.round(this.extensionData.duration * 1000) : null, // Convert to ms
      track_progress: this.extensionData.position ? Math.round(this.extensionData.position * 1000) : null, // Convert to ms
      volume: 0,
      thumbnail: this.extensionData.artwork || null,
      device: 'Chrome Extension',
      id: null,
      device_id: 'chrome-extension',
      source: 'chrome-extension'
    };

    DeskThing.sendSong(musicPayload);
  }

  private async handleMessage(message: NowPlayingMessage) {
    // Only process node-nowplaying messages if we're not using extension data
    if (this.useExtensionData) {
      return;
    }

    if (message.thumbnail) {
      message.thumbnail = await saveImage(message.thumbnail, (message.id || `${message.trackName}-${message.artist}`).replace(/[<>:"/\\|?*]/g, '_'))
    }

    this.nowPlayingInfo = message;
    this.parseAndSendData()
  }

  purge = () => {
    this.player.unsubscribe()
    this.nowPlayingInfo = undefined
    this.availableSources = []
  }

  stop = () => {
    this.player.unsubscribe()
    this.extensionWebSocket = null
  }

  start = async () => {
    if (!this.isSubscribed) {
      await this.player.subscribe();
      this.isSubscribed = true
    }
  }

  private getAbilities = (data: NowPlayingMessage) => {
    let abilities: SongAbilities[] = []
    if (data.canFastForward) abilities.push(SongAbilities.FAST_FORWARD)
    if (data.canLike) abilities.push(SongAbilities.LIKE)
    if (data.canSkip) abilities.push(SongAbilities.NEXT)
    if (data.canChangeVolume) abilities.push(SongAbilities.CHANGE_VOLUME)
    if (data.canSetOutput) abilities.push(SongAbilities.SET_OUTPUT)
    return abilities
  }

  private nanoToMilli = (nano: number) => {
    return nano / 10000
  }

  private parseAndSendData() {
    if (!this.nowPlayingInfo) return;

    /** 
     * Checks if the current track duration is extremely long (over 8 hours).
     * Used to identify potentially problematic track durations.
     */
    const isNano = this.nowPlayingInfo?.trackDuration && this.nowPlayingInfo.trackDuration > 18000000 // if it is larger than eight hours - assume it is nanoseconds and convert to ms

    const musicPayload: SongData = {
      version: 2,
      album: this.nowPlayingInfo.album || null,
      artist: this.nowPlayingInfo.artist?.[0] || null,
      playlist: this.nowPlayingInfo.playlist || null,
      playlist_id: this.nowPlayingInfo.playlistId || null,
      track_name: this.nowPlayingInfo.trackName,
      shuffle_state: this.nowPlayingInfo.shuffleState || null,
      repeat_state: (this.nowPlayingInfo.repeatState as "off" | "all" | "track") || "off",
      is_playing: this.nowPlayingInfo.isPlaying,
      abilities: this.getAbilities(this.nowPlayingInfo),
      track_duration: this.nowPlayingInfo.trackDuration && isNano ? this.nanoToMilli(this.nowPlayingInfo.trackDuration) : this.nowPlayingInfo.trackDuration || null,
      track_progress: this.nowPlayingInfo.trackProgress && isNano ? this.nanoToMilli(this.nowPlayingInfo.trackProgress) : this.nowPlayingInfo.trackProgress || null,
      volume: this.nowPlayingInfo.volume,
      thumbnail: this.nowPlayingInfo.thumbnail || null,
      device: this.nowPlayingInfo.device || null,
      id: this.nowPlayingInfo.id || null,
      device_id: this.nowPlayingInfo.deviceId || null,
      source: 'local'
    }
    DeskThing.sendSong(musicPayload)
  }
  public static getInstance(): MediaStore {
    if (!MediaStore.instance) {
      MediaStore.instance = new MediaStore();
    }
    return MediaStore.instance;
  }

  // Song GET events - now properly fetches fresh data
  public async handleGetSong() {
    console.log('📡 [MediaStore] GET song request - fetching fresh data from dashboard server')
    if (this.useExtensionData) {
      this.sendExtensionDataToDeskThing();
    } else if (this.player.refresh) {
      await this.player.refresh()
    } else {
      // Fallback to cached data if refresh not available
      this.parseAndSendData()
    }
  }
  
  public async handleRefresh() {
    console.log('🔄 [MediaStore] REFRESH request - fetching fresh data from dashboard server')
    if (this.useExtensionData) {
      this.sendExtensionDataToDeskThing();
    } else if (this.player.refresh) {
      await this.player.refresh()
    } else {
      // Fallback to cached data if refresh not available
      this.parseAndSendData()
    }
  }

  // Song SET events
  public handleFastForward(data: { amount: number | undefined }) {
    this.player.seekTo(data.amount || 0)
  }
  public handleLike() {
    DeskThing.sendWarning('Liking songs is not supported!')
  }
  public handleNext() {
    if (this.useExtensionData) {
      console.log('⏭️ [PREV/NEXT] Next track request - sending to Chrome extension');
      this.sendCommandToExtension('nexttrack');
    } else {
      console.log('⏭️ [PREV/NEXT] Next track request - using local player');
      this.player.nextTrack()
    }
  }
  public handlePause() {
    if (this.useExtensionData) {
      this.sendCommandToExtension('pause');
    } else {
      this.player.pause()
    }
  }
  public handlePlay() {
    if (this.useExtensionData) {
      this.sendCommandToExtension('play');
    } else {
      this.player.play()
    }
  }
  public handlePrevious() {
    if (this.useExtensionData) {
      console.log('⏮️ [PREV/NEXT] Previous track request - sending to Chrome extension');
      this.sendCommandToExtension('previoustrack');
    } else {
      console.log('⏮️ [PREV/NEXT] Previous track request - using local player');
      this.player.previousTrack()
    }
  }
  public handleRepeat() {
    DeskThing.sendWarning('Repeating songs is not supported!')
  }
  public handleRewind(data: { amount: number | undefined }) {
    if (this.useExtensionData) {
      // TODO: Implement seek command for extension
    } else {
      this.player.seekTo(data.amount || 0)
    }
  }
  public handleSeek(data: { positionMs: number }) {
    if (this.useExtensionData) {
      // TODO: Implement seek command for extension
    } else {
      this.player.seekTo(data.positionMs)
    }
  }
  public handleShuffle(data: { shuffle: boolean }) {
    if (this.useExtensionData) {
      // TODO: Implement shuffle command for extension
    } else {
      this.player.setShuffle(data.shuffle)
    }
  }
  public handleStop() {
    if (this.useExtensionData) {
      this.sendCommandToExtension('pause'); // Use pause for stop
    } else {
      this.player.pause()
    }
  }
  public handleVolume(data: { volume: number }) {
    if (this.useExtensionData) {
      // Volume control not supported for Chrome extension
    } else {
      this.player.setVolume(data.volume)
    }
  }
}
