import React, { useEffect, useState } from 'react'
import { SettingsStore } from './Stores/settingsStore'
import { Settings } from 'deskthing-client/dist/types'
import Record from './views/Record'
import Fullscreen from './views/Fullscreen'
import RecordCenter from './views/RecordCenter'

const App: React.FC = () => {
    const settingsStore = SettingsStore.getInstance()
    const [currentView, setCurrentview] = useState('record')

    useEffect(() => {
        const onSettings = async (data: Settings) => {
            console.log('Received data from the server!')
            console.log(data)
            if (data.recordplayer.view.value) {
                const currentView = data.recordplayer.view.value
                setCurrentview(currentView as string)
            }
        }
        
        const listener = settingsStore.on(onSettings)
        
        const getSettings = async () => {
            const settings = settingsStore.getSettings()
            if (settings) {
                if (settings.recordplayer.view.value) {
                    const currentView = settings.recordplayer.view.value
                    setCurrentview(currentView as string)
                }
            } else {
                console.log('Attempted to get settings too quick - none found')
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const settings = settingsStore.getSettings()
                if (settings) {
                    if (settings.recordplayer.view.value) {
                        const currentView = settings.recordplayer.view.value
                        setCurrentview(currentView as string)
    
                        }
                }
            }
        }

        getSettings()

        return () => {
            listener()
        }

    })

    const renderView = () => {
        switch (currentView) {
            case 'record':
                return <Record />
            case 'fullscreen':
                return <Fullscreen />
            case 'recordcenter':
                return <RecordCenter />
            default:
                return <div>Unknown View</div>
        }
    }


    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            {renderView()}
        </div>

    )
}

export default App
