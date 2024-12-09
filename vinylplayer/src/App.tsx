import React, { useEffect, useState } from 'react'
import { Settings } from 'deskthing-client/dist/types'
import Record from './views/Record'
import Fullscreen from './views/Fullscreen'
import RecordCenter from './views/RecordCenter'
import { AppSettings, DeskThing, SocketData } from 'deskthing-client'

const App: React.FC = () => {
    const [currentView, setCurrentview] = useState('record')
    const deskthing = DeskThing.getInstance()

    useEffect(() => {
        const onSettings = async (data: SocketData) => {
            const settings = data.payload as AppSettings
            console.log('Received data from the server!')
            console.log(data)
            if (settings.view.value) {
                const currentView = settings.view.value
                setCurrentview(currentView as string)
            }
        }
        
        const listener = deskthing.on('settings', onSettings)
        
        const getSettings = async () => {
            const settings = await deskthing.getSettings()
            if (settings) {
                if (settings.view.value) {
                    const currentView = settings.view.value
                    setCurrentview(currentView as string)
                }
            } else {
                console.log('Attempted to get settings too quick - none found')
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const settings = await deskthing.getSettings()
                if (settings) {
                    if (settings.view.value) {
                        const currentView = settings.view.value
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
