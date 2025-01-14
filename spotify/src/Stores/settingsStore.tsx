import { AppSettings, DeskThing, SocketData } from 'deskthing-client'

type SettingListener = (data: AppSettings) => Promise<void>

export class SettingsStore {
    private static instance: SettingsStore
    private listeners: ((data: SocketData) => void)[] = []
    private settingsListeners: SettingListener[] = []
    private currentSettings: AppSettings | undefined

    constructor() {
        this.listeners.push(DeskThing.on('settings', this.handleSetting.bind(this)))
        DeskThing.send({app: 'client', type: 'get', request: 'settings'})
    }

    static getInstance(): SettingsStore {
        if (!SettingsStore.instance) {
            SettingsStore.instance = new SettingsStore()
        }
        return SettingsStore.instance
    }

    private handleSetting(data: SocketData) {
        this.currentSettings = data.payload
        if (this.currentSettings != null) {
            this.settingsListeners.forEach(listener => listener(this.currentSettings as AppSettings))
        }
    }

    async getSettings(): Promise<AppSettings | undefined> {
        // DeskThing.send({app: 'utility', type: 'set', request: 'volume', payload: 100})
        if (!this.currentSettings) {
            this.currentSettings = await DeskThing.getSettings()
        }
        return this.currentSettings
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
}


export default SettingsStore.getInstance()
