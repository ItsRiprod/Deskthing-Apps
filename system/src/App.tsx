import React, { useEffect, useState } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()
    const [memUsage, setMemUsage] = useState(50)
    const [cpuUsage, setCpuUsage] = useState(0)

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            console.log(data)
            if (!data.payload) return
            if (typeof data.payload.memUsage === 'number') {
                setMemUsage(data.payload.memUsage);
            }
            if (typeof data.payload.cpuUsage === 'number') {
                setCpuUsage(data.payload.cpuUsage);
            }
            
        }
        const removeListener = deskthing.on('system', onAppData)

        return () => {
            removeListener()
        }
    })

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center gap-5">
            <div className="relative border-slate-500 border-2 w-1/4 h-1/4 flex items-center justify-center font-semibold text-white text-5xl rounded-xl overflow-hidden">
                <div style={{height: memUsage * 100 + '%'}} className="absolute bottom-0 bg-green-500 w-full" />
                <div className="z-10">MEM</div>
            </div>
            <div className="relative border-slate-500 border-2 w-1/4 h-1/4 flex items-center justify-center font-semibold text-white text-5xl rounded-xl overflow-hidden">
                <div style={{height: cpuUsage * 100 + '%'}} className="absolute bottom-0 bg-green-500 w-full" />
                <p className="z-10">CPU</p>
            </div>
        </div>

    )
}

export default App
