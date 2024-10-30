import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            console.log('Received data from the server!')
            console.log(data.payload)
        }
        // This listener will listen for your app's ID and trigger the onAppData whenever it receives data from your server.
        // On the server, run DeskThing.sendDataToClient({type: 'someType', payload: {someData: 'someData'}}) 
        // Then here, the data passed will be {app: 'yourAppID', payload: {someData: 'someData'}, type: 'someType'}
        const removeListener = deskthing.on('yourAppID', onAppData)

        return () => {
            removeListener()
        }
    })

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            <p className="font-bold text-5xl text-white">DeskThing App</p>
        </div>

    )
}

export default App
