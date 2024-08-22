import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-server'

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            console.log('Received data from the server!')
            console.log(data)
        }
        deskthing.on('yourAppID', onAppData)
    })

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            <p className="font-bold text-5xl text-white">DeskThing App</p>
        </div>

    )
}

export default App
