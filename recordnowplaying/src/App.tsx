import React, { useEffect, useState } from 'react'
import { SettingsStore } from './Stores/settingsStore'
import { Settings } from 'deskthing-client/dist/types'
import Record from './views/Record'

const App: React.FC = () => {
    const settingsStore = SettingsStore.getInstance()
    const [currentView, setCurrentview] = useState('record')

    useEffect(() => {
        const onSettings = async (data: Settings) => {
            console.log('Received data from the server!')
            console.log(data)
        }
        
        settingsStore.on(onSettings)
    })

    const renderView = () => {
        switch (currentView) {
            case 'record':
                return <Record />
            case 'settings':
                return <div>Settings View</div>
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
