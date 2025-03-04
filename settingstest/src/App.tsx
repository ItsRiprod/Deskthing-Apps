import React, { useEffect, useState } from 'react'
import { DeskThing } from '@deskthing/client'
import { SocketData } from 'deskthing-client/dist/types'

const App: React.FC = () => {
    const [color, setColor] = useState('')
    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            console.log('Received data from the server!')
            console.log(data.payload)
        }
        const onColorData = async (data: SocketData) => {
            if (typeof data.payload == 'string') {
                setColor(data.payload)
            }
        }
        // This listener will listen for your app's ID and trigger the onAppData whenever it receives data from your server.
        // On the server, run DeskThing.sendDataToClient({type: 'someType', payload: {someData: 'someData'}}) 
        // Then here, the data passed will be {app: 'yourAppID', payload: {someData: 'someData'}, type: 'someType'}
        const removeListener = DeskThing.on('settingstest', onAppData)
        const removeColorListener = DeskThing.on('color', onColorData)

        return () => {
            removeListener()
            removeColorListener()
        }
    })

    return (
        <div className="bg-slate-800 gap-2 w-screen h-screen flex flex-col justify-center items-center">
            <p className="font-bold text-5xl text-white">Settings Test</p>
            <div className="text-xl" style={{color: color}}>Task Color</div>
        </div>

    )
}

export default App
