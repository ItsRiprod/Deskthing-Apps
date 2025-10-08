import { DeskThing } from "@deskthing/server"
import { SongAbilities, SongData, SongData11 } from "@deskthing/types";
import { NowPlaying } from "./nowplayingWrapper";
import type { NowPlayingMessage, NowPlaying as NowPlayingType } from "node-nowplaying";
import { saveImage } from "./imageUtils";
import crypto from "crypto";
import loudness from 'loudness'

// Generates a deterministic, URL-safe hash from title + album
function getAudioHash(songId: string): string {
  // SHA-256, hex, truncated to 16 chars (64 bits)
  return crypto.createHash("sha256").update(songId).digest("hex").slice(0, 16);
}

export class MediaStore {
  private static instance: MediaStore;
  private player: NowPlayingType;
  private nowPlayingInfo: NowPlayingMessage | undefined = undefined;
  private availableSources: string[] = [];
  private lastSong: SongData11 | undefined = undefined;

  private isSubscribed = false

  private constructor() {
    this.player = new NowPlaying(this.handleMessage.bind(this));
  }

  public initializeListeners = async () => {
    if (!this.isSubscribed) {
      await this.player.subscribe();
      this.isSubscribed = true
    }
  }

  private async handleMessage(message: NowPlayingMessage) {
    if (message.thumbnail) {
      const safeName = getAudioHash(message.id || `${message.trackName}-${message.artist}`)
      message.thumbnail = await saveImage(message.thumbnail, safeName)
    }

    this.nowPlayingInfo = message;
    await this.parseAndSendData()
  }

  purge = () => {
    this.player.unsubscribe()
    this.nowPlayingInfo = undefined
    this.availableSources = []
  }

  stop = () => {
    this.player.unsubscribe()
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

  private async parseAndSendData() {
    if (!this.nowPlayingInfo) return;

    /** 
     * Checks if the current track duration is extremely long (over 8 hours).
     * Used to identify potentially problematic track durations.
     */
    const isNano = this.nowPlayingInfo?.trackDuration && this.nowPlayingInfo.trackDuration > 18000000 // if it is larger than eight hours - assume it is nanoseconds and convert to ms

    const currentVol = await loudness.getVolume()
    const musicPayload: SongData11 = {
      version: 2,
      source: 'local',
      track_name: this.nowPlayingInfo.trackName,
      album: this.nowPlayingInfo.album || null,
      artist: this.nowPlayingInfo.artist?.[0] || null,
      playlist: this.nowPlayingInfo.playlist || null,
      playlist_id: this.nowPlayingInfo.playlistId || null,
      shuffle_state: this.nowPlayingInfo.shuffleState ?? null,
      repeat_state: (this.nowPlayingInfo.repeatState as "off" | "all" | "track") || "off",
      is_playing: this.nowPlayingInfo.isPlaying,
      abilities: this.getAbilities(this.nowPlayingInfo),
      track_duration: this.nowPlayingInfo.trackDuration && isNano ? this.nanoToMilli(this.nowPlayingInfo.trackDuration) : this.nowPlayingInfo.trackDuration ?? null,
      track_progress: this.nowPlayingInfo.trackProgress && isNano ? this.nanoToMilli(this.nowPlayingInfo.trackProgress) : this.nowPlayingInfo.trackProgress ?? null,
      volume: currentVol,
      thumbnail: this.nowPlayingInfo.thumbnail || null,
      device: this.nowPlayingInfo.device || null,
      device_id: this.nowPlayingInfo.deviceId || null,
      id: this.nowPlayingInfo.id || null,
      can_like: this.nowPlayingInfo.canLike ?? undefined,
      can_change_volume: this.nowPlayingInfo.canChangeVolume ?? undefined,
      can_set_output: this.nowPlayingInfo.canSetOutput ?? undefined,
      can_fast_forward: this.nowPlayingInfo.canFastForward ?? undefined,
      can_skip: this.nowPlayingInfo.canSkip ?? undefined,
    }

    this.lastSong = musicPayload as SongData11

    DeskThing.sendSong(musicPayload)
  }
  public static getInstance(): MediaStore {
    if (!MediaStore.instance) {
      MediaStore.instance = new MediaStore();
    }
    return MediaStore.instance;
  }

  // Song GET events
  public async handleGetSong() {
    await this.parseAndSendData()
  }
  public async handleRefresh() {
    await this.parseAndSendData()
  }

  // Song SET events
  public handleFastForward(data: { amount: number | undefined }) {
    this.player.seekTo(data.amount || 0)
  }
  public handleLike() {
    console.warn('Liking songs is not supported!')
  }
  public handleNext() {
    this.player.nextTrack()
  }
  public handlePause() {
    this.player.pause()
  }
  public handlePlay() {
    this.player.play()
  }
  public handlePrevious() {
    this.player.previousTrack()
  }
  public handleRepeat() {
    console.warn('Repeating songs is not supported!')
  }
  public handleRewind(data: { amount: number | undefined }) {
    this.player.seekTo(data.amount || 0)
  }
  public handleSeek(data: { positionMs: number }) {
    this.player.seekTo(data.positionMs)
  }
  public handleShuffle(data: { shuffle: boolean }) {
    this.player.setShuffle(data.shuffle)
  }
  public handleStop() {
    this.player.pause()
  }


  // everything below is volume stuff

  private volumeTimeout: NodeJS.Timeout | null = null;

  private async setVolume(volume: number) {
    try {
      await loudness.setVolume(volume);
    
      if (!this.lastSong) return

      this.lastSong.volume = volume

      DeskThing.sendSong(this.lastSong) // send the updated volume to the server
    
    } catch (error) {
      console.error(`Failed to set volume to ${volume}! It may be due to an unsupported OS: `, error);
    }
  }

  public async handleVolume(data: { volume: number }) {
    // So I actually got screwed by Joey on this package and he never finished implementing "setVolume" on his node-nowplaying package...
    // we love
    // so instead, we will be sending the keyboard vol up/down events to change the volume
    // Here is what it SHOULD be:
    // this.player.setVolume(data.volume)
    
    if (!('volume' in data) || data.volume === undefined || data.volume === null || isNaN(data.volume)) {
      console.error('Volume is required');
      return;
    }

    if (data.volume < 0 || data.volume > 100) {
      // Clamp to 0 or 100 depending on which is closer
      data.volume = Math.abs(data.volume - 0) < Math.abs(data.volume - 100) ? 0 : 100;
    }

    // If a timeout is already set, clear it (we want to debounce)
    if (this.volumeTimeout) {
      clearTimeout(this.volumeTimeout);
      
      // Set a new timeout to process the latest volume after 500ms
      this.volumeTimeout = setTimeout(async () => {
        this.volumeTimeout = null;
        await this.setVolume(data.volume);
      }, 1000);

    } else {

      // set to an empty 500ms timeout for the debounce to work
      this.volumeTimeout = setTimeout(async () => {
        this.volumeTimeout = null
      }, 1000);

      // process first request immediately
      await this.setVolume(data.volume);
    }

  }
}
