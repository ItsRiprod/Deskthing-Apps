import { AppSettings, DeskThing, SocketData } from 'deskthing-client'

type SettingListener = (data: AppSettings) => Promise<void>
type TimeListener = (data: string) => Promise<void>

export class SettingsStore {
    private static instance: SettingsStore
    private deskthing: DeskThing
    private listeners: ((data: SocketData) => void)[] = []
    private settingsListeners: SettingListener[] = []
    private timeListeners: TimeListener[] = []
    private currentSettings: AppSettings | null = null
    private time: string = "00:00 AM"

    constructor() {
        this.deskthing = DeskThing.getInstance()
        this.listeners.push(this.deskthing.on('settings', this.handleSetting.bind(this)))
        this.listeners.push(this.deskthing.on('time', this.handleClient.bind(this)))
        this.deskthing.send({app: 'server', type: 'get'})
    }

    static getInstance(): SettingsStore {
        if (!SettingsStore.instance) {
            SettingsStore.instance = new SettingsStore()
        }
        return SettingsStore.instance
    }

    private handleSetting(data: SocketData) {
        const settings = data.payload as AppSettings
        this.currentSettings = settings
        if (this.currentSettings != null) {
            this.settingsListeners.forEach(listener => listener(this.currentSettings as AppSettings))
        }
    }

    private handleClient(data: SocketData) {
        console.log('Received client data', data)
        this.time = data.payload
        this.timeListeners.forEach(listener => listener(this.time))
    }

    getSettings(): AppSettings | null {
        // this.deskthing.sendMessageToParent({app: 'utility', type: 'set', request: 'volume', payload: 100})
        if (!this.currentSettings) {
            this.deskthing.send({app: 'client', type: 'get', request: 'settings'})
        }
        return this.currentSettings
    }

    getTime(): string {
        this.deskthing.send({app: 'server', type: 'get'})
        return this.time
    }

    on(listener: SettingListener): () => void {
        this.settingsListeners.push(listener)
        return () => {
            this.settingsListeners = this.settingsListeners.filter(l => l !== listener)
        }
    }
    off(listener: SettingListener) {
        this.settingsListeners = this.settingsListeners.filter(l => l !== listener)
    }

    onTime(listener: TimeListener): () => void {
        console.log('Removing time')
        this.timeListeners.push(listener)
        return () => {
            this.timeListeners = this.timeListeners.filter(l => l !== listener)
        }
    }
    offTime(listener: TimeListener) {
        this.timeListeners = this.timeListeners.filter(l => l !== listener)
    }
}


export default SettingsStore.getInstance()
