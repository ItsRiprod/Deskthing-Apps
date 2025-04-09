import { DeskThing } from "@deskthing/server"
import { SongData } from "@deskthing/types";
import { NowPlaying, NowPlayingMessage } from "node-nowplaying";

export class MediaStore {
  private static instance: MediaStore;
  private player: NowPlaying;
  private nowPlayingInfo: NowPlayingMessage | undefined = undefined;
  private availableSources: string[] = [];

  private constructor() {
    this.player = new NowPlaying(this.handleMessage.bind(this));
  }

  public initializeListeners = async () => {
    await this.player.subscribe();
  }

  private handleMessage(message: NowPlayingMessage) {
    this.nowPlayingInfo = message;
    this.parseAndSendData()
  }

  private parseAndSendData() {
    if (!this.nowPlayingInfo) return;
    const musicPayload: SongData = {
      album: this.nowPlayingInfo.album || null,
      artist: this.nowPlayingInfo.artist?.[0] || null,
      playlist: this.nowPlayingInfo.playlist || null,
      playlist_id: this.nowPlayingInfo.playlistId || null,
      track_name: this.nowPlayingInfo.trackName,
      shuffle_state: this.nowPlayingInfo.shuffleState || null,
      repeat_state: (this.nowPlayingInfo.repeatState as "context" | "track" | "off") || "off",
      is_playing: this.nowPlayingInfo.isPlaying,
      can_fast_forward: this.nowPlayingInfo.canFastForward,
      can_skip: this.nowPlayingInfo.canSkip,
      can_like: this.nowPlayingInfo.canLike,
      can_change_volume: this.nowPlayingInfo.canChangeVolume,
      can_set_output: this.nowPlayingInfo.canSetOutput,
      track_duration: this.nowPlayingInfo.trackDuration || null,
      track_progress: this.nowPlayingInfo.trackProgress || null,
      volume: this.nowPlayingInfo.volume,
      thumbnail: this.nowPlayingInfo.thumbnail || null,
      device: this.nowPlayingInfo.device || null,
      id: this.nowPlayingInfo.id || null,
      device_id: this.nowPlayingInfo.deviceId || null
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
