import { DeskThing } from 'deskthing-client'
import { SongData, SocketData } from 'deskthing-client/dist/types'

type MusicListener = (data: SongData) => Promise<void>

export class MusicStore {
    private static instance: MusicStore
    private deskthing: DeskThing
    private listeners: ((data: SocketData) => void)[] = []
    private musicListeners: MusicListener[] = []
    private currentSong: SongData | null = null

    constructor() {
        this.deskthing = DeskThing.getInstance()
        this.listeners.push(this.deskthing.on('music', this.handleMusic.bind(this)))
        this.deskthing.sendMessageToParent({app: 'client', type: 'get', request: 'song'})
    }

    static getInstance(): MusicStore {
        if (!MusicStore.instance) {
            MusicStore.instance = new MusicStore()
        }
        return MusicStore.instance
    }

    private handleMusic(data: SongData) {
        this.currentSong = data
        if (this.currentSong != null) {
            this.musicListeners.forEach(listener => listener(this.currentSong as SongData))
        }
    }

    getSong(): SongData | null {
        return this.currentSong
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
