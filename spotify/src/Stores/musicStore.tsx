import { DeskThing, SongData, SocketData } from 'deskthing-client'
import { findAlbumArtColor } from '../Utils/colorUtils'
import { AudioFeaturesResponse, Playlist, SpotifyAudioAnalysis } from '../types/spotify'

type MusicListener = (data: SongData | SpotifyAudioAnalysis | AudioFeaturesResponse | Playlist[] | null, backgroundColor?: number[]) => Promise<void>

type ListenerType = 'music' | 'analysis' | 'features' | 'playlists'

export class MusicStore {
    private static instance: MusicStore
    private deskthing: DeskThing
    private listeners: ((data: SocketData) => void)[] = []
    private musicListeners: Record<ListenerType, MusicListener[]> = {
        music: [],
        analysis: [],
        features: [],
        playlists: [],
    }
    private currentSong: SongData | null = null
    private backgroundColor: number[] = []
    private analysisData: SpotifyAudioAnalysis | null = null
    private featuresData: AudioFeaturesResponse | null = null
    private playlists: Playlist[] = []

    constructor() {
        this.deskthing = DeskThing.getInstance()
        this.listeners.push(this.deskthing.on('music', this.handleMusic.bind(this)))
        this.listeners.push(this.deskthing.on('spotify', this.onAnalysisData.bind(this)))

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
          this.deskthing.sendMessageToParent({
            app: 'client',
            type: 'get',
            request: 'music',
          });
          this.deskthing.sendMessageToParent({type: 'get', request: 'analysis'})
          this.deskthing.sendMessageToParent({type: 'get', request: 'playlists'})
          this.deskthing.sendMessageToParent({type: 'get', request: 'features'})
        }
    }

    private async onAnalysisData(data: SocketData) {
        if (data.type == 'analysis') {
            this.analysisData = data.payload as SpotifyAudioAnalysis
            if (this.analysisData != null) {
                await Promise.all(this.musicListeners['analysis'].map(listener => listener(this.analysisData)))
            }
        } else if (data.type == 'features') {
            this.featuresData = data.payload as AudioFeaturesResponse
            if (this.featuresData != null) {
                await Promise.all(this.musicListeners['features'].map(listener => listener(this.featuresData)))
            }
        } else if (data.type == 'playlists') {
            this.playlists = data.payload as Playlist[]
            if (this.playlists != null) {
                await Promise.all(this.musicListeners['playlists'].map(listener => listener(this.playlists)))
            }
        }
    }

    private async handleMusic(data: SongData) {
        const updateThumbnail = this.currentSong?.thumbnail !== data.thumbnail
        this.currentSong = data
        if (this.currentSong != null) {
            if (this.currentSong.thumbnail && updateThumbnail) {
                const img = new Image()
                img.src = this.currentSong.thumbnail
                await img.decode()
                const color = await findAlbumArtColor(img)
                if (color) {
                    this.backgroundColor = color
                }
            }
            if (updateThumbnail) {
                this.deskthing.sendMessageToParent({type: 'get', request: 'analysis'})
                this.deskthing.sendMessageToParent({type: 'get', request: 'features'})
            }
            await Promise.all(this.musicListeners['music'].map(listener => listener(this.currentSong as SongData, this.backgroundColor)))
        }
    }

    getBackgroundColor(): number[] {
        return this.backgroundColor
    }

    getSong(): SongData | null {
        return this.currentSong
    }

    getAnalysisData(): SpotifyAudioAnalysis | null {
        return this.analysisData
    }

    getFeaturesData(): AudioFeaturesResponse | null {
        if (!this.featuresData) {
            this.deskthing.sendMessageToParent({type: 'get', request: 'features'})
        }
        return this.featuresData
    }

    getPlaylists(): Playlist[] {
        if (!this.playlists) {
            this.deskthing.sendMessageToParent({type: 'get', request: 'playlists'})
        }
        return this.playlists
    }

    setPlay(state: boolean) {
        if (this.currentSong) {
            this.currentSong.is_playing = state
            this.musicListeners['music'].forEach(listener => listener(this.currentSong as SongData, this.backgroundColor))
        }
    }

    playPlaylist(playlistIndex: number) {
        this.deskthing.sendMessageToParent({type: 'set', request: 'play_playlist', payload: playlistIndex})
    }

    addToPlaylist(playlistIndex: number) {
        this.deskthing.sendMessageToParent({type: 'set', request: 'add_playlist', payload: playlistIndex})
    }
    
    setPlaylist(playlistIndex: number) {
        console.log('setPlaylist', playlistIndex)
        this.deskthing.sendMessageToParent({type: 'set', request: 'set_playlist', payload: playlistIndex})
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
