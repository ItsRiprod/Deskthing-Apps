import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            console.log('Received data from the server!')
            console.log(data)
        }
        const removeListener = deskthing.on('yourAppID', onAppData)

        return () => {
            removeListener()
        }
    })

    return (
        <div className="bg-slate-800 w-screen h-screen flex-col flex justify-center items-center">
            <p className="font-bold text-5xl text-white">Discord App is under development</p>
            <p className="font-bold text-center text-gray-500">Due to technical limitations of the client, the development of the discord app has been postponed. If you want to help spur on the development of DeskThing, head over to the Discord!</p>
        </div>

    )
}

export default App
