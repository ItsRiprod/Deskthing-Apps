import React, { useEffect, useState } from 'react'
import Record from './views/Record'
import Fullscreen from './views/Fullscreen'
import RecordCenter from './views/RecordCenter'
import { AppSettings, FromDeviceDataEvents } from '@deskthing/types'
import { DeskThing } from '@deskthing/client'

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState('record')

    useEffect(() => {
        let invalid = false

        const listener = DeskThing.on(FromDeviceDataEvents.SETTINGS, async (data) => {
            if (invalid) return
            const settings = data.payload as AppSettings
            console.log('Received data from the server!')
            console.log(data)
            if (settings.view.value) {
                const currentView = settings.view.value
                setCurrentView(currentView as string)
            }
        })
        
        const getSettings = async () => {
            const settings = await DeskThing.getSettings()
            if (invalid) return
            if (settings) {
                if (settings.view.value) {
                    const currentView = settings.view.value
                    setCurrentView(currentView as string)
                }
            } else {
                console.log('Attempted to get settings too quick - none found')
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const settings = await DeskThing.getSettings()
                if (settings) {
                    if (settings.view.value) {
                        const currentView = settings.view.value
                        setCurrentView(currentView as string)
    
                        }
                }
            }
        }

        getSettings()

        return () => {
            listener()
            invalid = true
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
