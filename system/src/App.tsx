import React, { useEffect, useState } from 'react'
import Default from './components/Default'
import Cpu from './components/Cpu'
import { SystemDataEvents, ToAppData, ToClientData, ViewOptions } from '@shared/types'
import { createDeskThing } from '@deskthing/client'

const DeskThing = createDeskThing<ToClientData, ToAppData>()

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewOptions>(ViewOptions.DEFAULT)

    useEffect(() => {
        
        const listener = DeskThing.on(SystemDataEvents.VIEW, async (data) => {            
            if (data.payload) {
                setCurrentView(data.payload)
            }
        })

        return () => {
            listener()
        }

    }, [])

    const renderView = () => {
        switch (currentView) {
            case ViewOptions.DEFAULT:
                return <Default />
            case ViewOptions.GPU:
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
