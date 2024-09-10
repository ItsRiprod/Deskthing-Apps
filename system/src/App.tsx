import React, { useEffect, useState } from 'react'
import { SettingsStore } from './stores/settingsStore'
import { Settings } from 'deskthing-client'
import Default from './components/Default'
import Cpu from './components/Cpu'

const App: React.FC = () => {
    const settingsStore = SettingsStore.getInstance()
    const [currentView, setCurrentview] = useState('gpu')

    useEffect(() => {
        const onSettings = async (data: Settings) => {
            if (data.system.view.value) {
                const currentView = data.system.view.value
                setCurrentview(currentView as string)
            }
        }
        
        const listener = settingsStore.on(onSettings)


        // Get the settings initially (if available)
        const getSettings = async () => {
            const settings = settingsStore.getSettings()
            if (settings) {
                if (settings.system.view.value) {
                    const currentView = settings.system.view.value
                    setCurrentview(currentView as string)
                }
            } else {
                console.log('Attempted to get settings too quick - none found')
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const settings = settingsStore.getSettings()
                if (settings) {
                    if (settings.system.view.value) {
                        const currentView = settings.system.view.value
                        setCurrentview(currentView as string)
    
                        }
                }
            }
        }

        getSettings()

        return () => {
            listener()
        }

    }, [])

    const renderView = () => {
        switch (currentView) {
            case 'default':
                return <Default />
            case 'gpu':
                return <Cpu />
            default:
                return <div className="text-white">Unknown View</div>
        }
    }

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            {renderView()}
        </div>

    )
}

export default App
