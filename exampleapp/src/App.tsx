import React, { useEffect } from 'react'
import { DeskThing, SocketData } from 'deskthing-client'

const App: React.FC = () => {
    const [data, setData] = React.useState<string>('')
    const [image, setImage] = React.useState<string>('')
    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            setData(data.payload.someData)
        }
        // This listener will listen for your app's ID and trigger the onAppData whenever it receives data from your server.
        // On the server, run DeskThing.sendDataToClient({type: 'someType', payload: {someData: 'someData'}}) 
        // Then here, the data passed will be {app: 'yourAppID', payload: {someData: 'someData'}, type: 'someType'}
        const removeListener = DeskThing.on('sampleData', onAppData)

        return () => {
            removeListener()
        }
    })

    const getSampleImage = async () => {
        const imageUrl = await DeskThing.fetchData<string>('image', { type: 'get', request: 'image' })
        if (imageUrl) {
            const formattedImage = DeskThing.formatImageUrl(imageUrl)
            setImage(formattedImage)
        }
    }

    return (
        <div className="bg-slate-800 w-screen h-screen flex-col flex justify-center items-center">
            <p className="font-bold text-5xl text-white">Example App</p>
            <p>Sample Data: {data}</p>
            <button onClick={getSampleImage} className="p-2 bg-cyan-500">Get Data</button>
            <img src={image} />
        </div>

    )
}

export default App
