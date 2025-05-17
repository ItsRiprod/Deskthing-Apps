import { DeskThing } from "@deskthing/server"
import { SongAbilities, SongData } from "@deskthing/types";
import { NowPlaying } from "./nowplayingWrapper";
import type { NowPlayingMessage, NowPlaying as NowPlayingType } from "node-nowplaying";
import { saveBase64AsPng } from "./imageUtils";

export class MediaStore {
  private static instance: MediaStore;
  private player: NowPlayingType;
  private nowPlayingInfo: NowPlayingMessage | undefined = undefined;
  private availableSources: string[] = [];

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
      message.thumbnail = await saveBase64AsPng(message.thumbnail, (message.id || `${message.trackName}-${message.artist}`).replace(/[<>:"/\\|?*]/g, '_'))
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

  // Song GET events
  public handleGetSong() {
    this.parseAndSendData()
  }
  public handleRefresh() {
    this.parseAndSendData()
  }

  // Song SET events
  public handleFastForward(data: { amount: number | undefined }) {
    this.player.seekTo(data.amount || 0)
  }
  public handleLike() {
    DeskThing.sendWarning('Liking songs is not supported!')
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
    DeskThing.sendWarning('Repeating songs is not supported!')
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
  public handleVolume(data: { volume: number }) {
    this.player.setVolume(data.volume)
  }
}
