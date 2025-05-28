
import { DeskThing } from '@deskthing/server'
import { ActionStore } from './actionStore'
import { AuthStore } from './authStore'
import { PlaylistStore } from './playlistStore'
import { SongStore } from './songStore'
import { SpotifyStore } from './spotifyStore'
import { DeskthingStore } from './deskthingStore'
import { DeviceStore } from './deviceStore'
import { QueueStore } from './queueStore'

export class StoreProvider {
  private static instance: StoreProvider
  private actionStore: ActionStore
  private authStore: AuthStore
  private playlistStore: PlaylistStore
  private songStore: SongStore
  private spotifyApi: SpotifyStore
  private deviceStore: DeviceStore
  private queueStore: QueueStore
  private deskthingStore: DeskthingStore

  private constructor() {
    this.authStore = new AuthStore()
    this.spotifyApi = new SpotifyStore(this.authStore)
    this.playlistStore = new PlaylistStore(this.spotifyApi, this.authStore)
    this.deviceStore = new DeviceStore(this.spotifyApi)
    this.songStore = new SongStore(this.spotifyApi, this.deviceStore)
    this.actionStore = new ActionStore(
      this.spotifyApi,
      this.authStore,
      this.playlistStore,
      this.songStore
    )
    this.queueStore = new QueueStore(this.spotifyApi)
    this.deskthingStore = new DeskthingStore(
      this.songStore,
      this.playlistStore,
      this.authStore,
      this.deviceStore
    )
  }

  public static getInstance(): StoreProvider {
    if (!StoreProvider.instance) {
      StoreProvider.instance = new StoreProvider()
    }
    return StoreProvider.instance
  }

  public getActionStore(): ActionStore {
    return this.actionStore
  }

  public getAuthStore(): AuthStore {
    return this.authStore
  }

  public getPlaylistStore(): PlaylistStore {
    return this.playlistStore
  }

  public getSongStore(): SongStore {
    return this.songStore
  }

  public getSpotifyApi(): SpotifyStore {
    return this.spotifyApi
  }

  public getQueueStore(): QueueStore {
    return this.queueStore
  }

  public getDeskthingStore(): DeskthingStore {
    return this.deskthingStore
  }
}

export default StoreProvider.getInstance()