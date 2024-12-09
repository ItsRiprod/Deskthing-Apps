import React, { useEffect, useState } from 'react'
import { AppSettings, DeskThing } from 'deskthing-client'
import Default from './components/Default'
import Cpu from './components/Cpu'

const App: React.FC = () => {
    const [currentView, setCurrentview] = useState('default')

    useEffect(() => {
        const onSettings = async (data: AppSettings) => {
            if (data.view.value) {
                const currentView = data.view.value
                setCurrentview(currentView as string)
            }
        }
        
        const listener = DeskThing.getInstance().on('settings', onSettings)

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
