import { SongData, SocketData } from '@deskthing/types'
import { DeskThing } from '@deskthing/client'
import { AudioFeaturesResponse, Playlist, SpotifyAudioAnalysis } from '../types/spotify'

type MusicListener = (data: SongData | SpotifyAudioAnalysis | AudioFeaturesResponse | Playlist[] | null, backgroundColor?: string) => Promise<void>

type ListenerType = 'music' | 'playlists'

export class MusicStore {
    private static instance: MusicStore
    private listeners: ((data: SocketData) => void)[] = []
    private musicListeners: Record<ListenerType, MusicListener[]> = {
        music: [],
        playlists: [],
    }
    private currentSong: SongData | null = null
    private backgroundColor: string = ''
    private playlists: Playlist[] = []

    constructor() {
        this.listeners.push(DeskThing.on('music', this.handleMusic.bind(this)))
        this.listeners.push(DeskThing.on('playlists', this.onPlaylistData.bind(this)))
        this.fetchInitialSong()
    }

    static getInstance(): MusicStore {
        if (!MusicStore.instance) {
            MusicStore.instance = new MusicStore()
        }
        return MusicStore.instance
    }

    async fetchInitialSong() {
        if (!this.currentSong) {
          DeskThing.send({
            app: 'client',
            type: 'get',
            request: 'music',
          });
          DeskThing.send({type: 'get', request: 'playlists'})

          const songData = await DeskThing.getMusic()
          if (songData) {
              this.currentSong = songData
          }
        }
    }

    private async onPlaylistData(data: SocketData) {
        if (data.type == 'playlists') {
            this.playlists = data.payload as Playlist[]
            if (this.playlists != null) {
                await Promise.all(this.musicListeners['playlists'].map(listener => listener(this.playlists)))
            }
        }
    }

    private async handleMusic(data: SocketData) {
        const song = data.payload as SongData
        this.currentSong = song
        if (this.currentSong != null) {
            if (this.currentSong.color) {
                this.backgroundColor = this.currentSong.color.rgb
            }
            await Promise.all(this.musicListeners['music'].map(listener => listener(this.currentSong as SongData, this.backgroundColor)))
        }
    }

    getSong(): SongData | null {
        return this.currentSong
    }

    getPlaylists(): Playlist[] {
        if (!this.playlists) {
            DeskThing.send({type: 'get', request: 'playlists'})
        }
        return this.playlists
    }

    getBackgroundColor(): string {
        return this.backgroundColor
    }

    playPlaylist(playlistIndex: number) {
        DeskThing.send({type: 'set', request: 'play_playlist', payload: playlistIndex})
    }

    addToPlaylist(playlistIndex: number) {
        DeskThing.send({type: 'set', request: 'add_playlist', payload: playlistIndex})
    }
    
    setPlaylist(playlistIndex: number) {
        console.log('setPlaylist', playlistIndex)
        DeskThing.send({type: 'set', request: 'set_playlist', payload: playlistIndex})
    }

    on(type: ListenerType, listener: MusicListener): () => void {
        this.musicListeners[type].push(listener)

        if (this.currentSong) {
            listener(this.currentSong, this.backgroundColor)
        }
        return () => {
            this.off(type, listener)
        }
    }

    off(type: ListenerType, listener: MusicListener) {
        this.musicListeners[type] = this.musicListeners[type].filter(l => l !== listener)
    }



}


export default MusicStore.getInstance()
