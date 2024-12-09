import { DeskThing, SongData, SocketData } from 'deskthing-client'
import { AudioFeaturesResponse, Playlist, SpotifyAudioAnalysis } from '../types/spotify'

type MusicListener = (data: SongData | SpotifyAudioAnalysis | AudioFeaturesResponse | Playlist[] | null, backgroundColor?: string) => Promise<void>

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
    private backgroundColor: string = ''
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
          this.deskthing.send({
            app: 'client',
            type: 'get',
            request: 'music',
          });
          this.deskthing.send({type: 'get', request: 'analysis'})
          this.deskthing.send({type: 'get', request: 'playlists'})
          this.deskthing.send({type: 'get', request: 'features'})
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

    private async handleMusic(data: SocketData) {
        const song = data.payload as SongData
        const updateThumbnail = this.currentSong?.thumbnail !== song.thumbnail
        this.currentSong = song
        if (this.currentSong != null) {
            if (this.currentSong.color) {
                this.backgroundColor = this.currentSong.color.rgb
            }
            if (updateThumbnail) {
                this.deskthing.send({type: 'get', request: 'analysis'})
                this.deskthing.send({type: 'get', request: 'features'})
            }
            await Promise.all(this.musicListeners['music'].map(listener => listener(this.currentSong as SongData, this.backgroundColor)))
        }
    }

    getBackgroundColor(): string {
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
            this.deskthing.send({type: 'get', request: 'features'})
        }
        return this.featuresData
    }

    getPlaylists(): Playlist[] {
        if (!this.playlists) {
            this.deskthing.send({type: 'get', request: 'playlists'})
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
        this.deskthing.send({type: 'set', request: 'play_playlist', payload: playlistIndex})
    }

    addToPlaylist(playlistIndex: number) {
        this.deskthing.send({type: 'set', request: 'add_playlist', payload: playlistIndex})
    }
    
    setPlaylist(playlistIndex: number) {
        console.log('setPlaylist', playlistIndex)
        this.deskthing.send({type: 'set', request: 'set_playlist', payload: playlistIndex})
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
