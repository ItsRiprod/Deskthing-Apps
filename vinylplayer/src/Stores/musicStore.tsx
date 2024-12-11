import { DeskThing, SongData, SocketData } from 'deskthing-client'

type MusicListener = (data: SongData) => Promise<void>

const sampleSongData: SongData = {
    album: "Loading Album",
    artist: "Loading Artist",
    track_duration: 180,
    id: "sample-id",
    is_playing: false,
    playlist: "Sample Playlist",
    playlist_id: "sample-playlist-id",
    track_progress: 0,
    track_name: "Loading Track...",
    volume: 1,
    thumbnail: "https://i.scdn.co/image/ab67616d0000485109d8b71a33c39ffc81bc738f",
    repeat_state: 'track',
    shuffle_state: false,
    isLiked: false,
    can_fast_forward: true,
    can_skip: true,
    can_like: true,
    can_change_volume: true,
    can_set_output: true,
    device: "Sample Device",
    device_id: "sample-device-id",
    color: {
        value: [40, 40, 40, 1],
        rgb: "rgb(40,40,40)",
        rgba: "rgba(40,40,40,1)",
        hex: "#282828",
        hexa: "#282828FF",
        isDark: true,
        isLight: false
    }}
export class MusicStore {
    private static instance: MusicStore
    private deskthing: DeskThing
    private listeners: ((data: SocketData) => void)[] = []
    private musicListeners: MusicListener[] = []
    private currentSong: SongData = sampleSongData

    constructor() {
        this.deskthing = DeskThing.getInstance()
        this.listeners.push(this.deskthing.on('music', this.handleMusic.bind(this)))
        this.deskthing.send({app: 'client', type: 'get', request: 'song'})
    }

    static getInstance(): MusicStore {
        if (!MusicStore.instance) {
            MusicStore.instance = new MusicStore()
        }
        return MusicStore.instance
    }

    private handleMusic(data: SocketData) {
        this.currentSong = data.payload as SongData
        if (this.currentSong != null) {
            this.musicListeners.forEach(listener => listener(this.currentSong as SongData))
        }
    }

    getSong(): SongData | null {
        return this.currentSong
    }

    setPlay(state: boolean) {
        if (this.currentSong) {
            this.currentSong.is_playing = state
            this.musicListeners.forEach(listener => listener(this.currentSong as SongData))
        }
    }

    on(listener: MusicListener): () => void {
        this.musicListeners.push(listener)
        return () => {
            this.musicListeners = this.musicListeners.filter(l => l !== listener)
        }
    }
    off(listener: MusicListener) {
        this.musicListeners = this.musicListeners.filter(l => l !== listener)
    }



}


export default MusicStore.getInstance()
