import React, { useEffect, useState } from 'react'
import { SocketData, SongData } from '@deskthing/types'
import PlayPause from '../assets/components/PlayPause'
import Skip from '../assets/components/Skip'
import Rewind from '../assets/components/Rewind'
import { DeskThing } from '@deskthing/client'

const RecordCenter: React.FC = () => {
    const [songData, setSongData] = useState<SongData | null>(null)
    const [thumbnail, setThumbnail] = useState<string>('')
    const [isPlaying, setIsPlaying] = useState<boolean>(false)

    useEffect(() => {
        let isMounted = true

        const onMusicUpdates = async (data: SocketData) => {
            if (!isMounted) return
            const songData = data.payload as SongData
            setSongData(songData)
            setIsPlaying(songData.is_playing)
            if (songData.thumbnail && songData.thumbnail !== thumbnail) {
                setThumbnail(DeskThing.formatImageUrl(songData.thumbnail))
            }
        }
        
        const initializeData = async () => {
            try {
                const data = await DeskThing.getMusic()
                if (isMounted && data) {
                    setSongData(data)
                    setThumbnail(data.thumbnail || '')
                }
            } catch (error) {
                console.error('Failed to initialize music data:', error)
            }
        }

        initializeData()

        const unsubscribe = DeskThing.on('music', onMusicUpdates)

        return () => {
            isMounted = false
            unsubscribe()
        }
    }, [thumbnail])

    return (
        <div style={{background:`${songData ? songData.color?.rgba : 'rgb(0, 0, 0)'}`}} className="bg-slate-800 w-screen overflow-hidden h-screen flex justify-center items-center">
            <div className={`w-screen h-[100vw] ${isPlaying ? 'animate-spin-slow' : 'rotate-0'}`}>
                <div style={{backgroundImage:`url(./vinyl.svg)`}} className="border-black border- w-full h-full bg-cover bg-center bg-no-repeat " />
                <div style={{backgroundImage:`url(${thumbnail})`}} className="absolute blur-sm rounded-full left-1/4 top-1/4 border-black border-2 border- w-[50%] h-[50%] bg-cover bg-center bg-no-repeat " />
            </div>
            <div className="fixed flex justify-center items-center">
                <div className="absolute index-0">
                    <div className="flex flex-col justify-center items-center">
                        <h1 style={{color: 'var(--background-contrast)'}} className="text-nowrap text-justify text-4xl font-bold">
                            {songData?.track_name || 'Track Name'}
                        </h1>
                        <p style={{color: 'var(--background-contrast)'}} className="text-2xl font-semibold text-justify font-mono">
                            {songData?.artist || 'Unknown Artist'}
                        </p>
                        <div className="mt-5 left-5 flex">
                            <Rewind />
                            <PlayPause />
                            <Skip />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default RecordCenter
