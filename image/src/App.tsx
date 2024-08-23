import React, { useEffect, useState } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-server'

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()
    const [imageData, setImageData] = useState<string | null>(null);

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            if (data.type == 'imageData') {
                if (data.payload) {
                    setImageData(data.payload as string);
                }
            }
        }
        deskthing.on('image', onAppData)

        deskthing.sendMessageToParent({type: 'get', request: 'image'})
    })

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            {imageData ? (
                <img src={imageData} alt="Received from server" className="w-full h-full" />
            ) : (
                <p className="font-bold text-5xl text-white">Image App</p>
            )}
        </div>

    )
}

export default App
