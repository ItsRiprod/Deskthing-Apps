import { DeskThing } from 'deskthing-client'
import { Settings, SocketData } from 'deskthing-client/dist/types'

type SettingListener = (data: Settings) => Promise<void>

export class SettingsStore {
    private static instance: SettingsStore
    private deskthing: DeskThing
    private listeners: ((data: SocketData) => void)[] = []
    private settingsListeners: SettingListener[] = []
    private currentSettings: Settings | null = null

    constructor() {
        this.deskthing = DeskThing.getInstance()
        this.listeners.push(this.deskthing.on('settings', this.handleSetting.bind(this)))
        this.deskthing.sendMessageToParent({app: 'client', type: 'get', request: 'settings'})
    }

    static getInstance(): SettingsStore {
        if (!SettingsStore.instance) {
            SettingsStore.instance = new SettingsStore()
        }
        return SettingsStore.instance
    }

    private handleSetting(data: Settings) {
        this.currentSettings = data
        if (this.currentSettings != null) {
            this.settingsListeners.forEach(listener => listener(this.currentSettings as Settings))
        }
    }

    getSettings(): Settings | null {
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
