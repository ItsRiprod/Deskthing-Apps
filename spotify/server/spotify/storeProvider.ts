
import { DeskThing } from '@deskthing/server'
import { ActionStore } from './actionStore'
import { AuthStore } from './authStore'
import { PlaylistStore } from './playlistStore'
import { SongStore } from './songStore'
import { SpotifyStore } from './spotifyStore'
import { DeskthingStore } from './deskthingStore'

export class StoreProvider {
  private static instance: StoreProvider
  private actionStore: ActionStore
  private authStore: AuthStore
  private playlistStore: PlaylistStore
  private songStore: SongStore
  private spotifyApi: SpotifyStore
  private deskthingStore: DeskthingStore

  private constructor() {
    this.authStore = new AuthStore()
    this.spotifyApi = new SpotifyStore(this.authStore)
    this.playlistStore = new PlaylistStore(this.spotifyApi)
    this.songStore = new SongStore(this.spotifyApi)
    this.actionStore = new ActionStore(
      this.spotifyApi,
      this.authStore,
      this.playlistStore,
      this.songStore
    )
    this.deskthingStore = new DeskthingStore(
      this.actionStore,
      this.spotifyApi,
      this.songStore,
      this.playlistStore,
      this.authStore
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

  public async initialize() {
    try {
      await this.playlistStore.initializePlaylists()
      DeskThing.sendLog('Store Provider initialized successfully')
    } catch (error) {
      DeskThing.sendError(`Failed to initialize Store Provider: ${error}`)
    }
  }
}

export default StoreProvider.getInstance()