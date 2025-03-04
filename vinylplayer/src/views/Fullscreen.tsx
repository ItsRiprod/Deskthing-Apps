import React, { useEffect, useState } from 'react'
import { SocketData, SongData } from '@deskthing/types'
import PlayPause from '../assets/components/PlayPause'
import Skip from '../assets/components/Skip'
import Rewind from '../assets/components/Rewind'
import { DeskThing } from '@deskthing/client'

const Fullscreen: React.FC = () => {
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
        <div style={{background:`${songData ? songData.color?.rgba : 'rgb(0, 0, 0)'}`}} className="bg-slate-800 w-screen h-screen overflow-hidden flex justify-center items-center">
            <div style={{backgroundImage:`url(${thumbnail})`}} className="absolute blur-sm border-black border-2 border- w-[100%] h-[100%] bg-cover bg-center bg-no-repeat " />
            <div className="fixed flex justify-center items-center">
                <div className="index-0 flex justify-around w-screen">
                    <div>
                        <div style={{backgroundImage:`url(${thumbnail})`}} className="border-black border-2 border- w-[75vh] h-[75vh] bg-cover bg-center bg-no-repeat " />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <h1 style={{color: 'var(--background-contrast)'}} className="text-nowrap text-4xl font-bold">
                            {songData?.track_name}
                        </h1>
                        <p style={{color: 'var(--background-contrast)'}} className="text-2xl font-semibold font-mono">
                            {songData?.artist}
                        </p>
                        <div className="mt-5 flex">
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

export default Fullscreen