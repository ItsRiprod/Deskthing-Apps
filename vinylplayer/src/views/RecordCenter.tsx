import React, { useEffect, useState } from 'react'
import { MusicStore } from '../Stores/musicStore'
import { SongData } from 'deskthing-client'
import PlayPause from '../assets/components/PlayPause'
import Skip from '../assets/components/Skip'
import Rewind from '../assets/components/Rewind'

const RecordCenter: React.FC = () => {
    const musicStore = MusicStore.getInstance()
    const [songData, setSongData] = useState<SongData | null>(musicStore.getSong())
    const [thumbnail, setThumbnail] = useState<string>(songData?.thumbnail || '')
    const [isPlaying, setIsPlaying] = useState<boolean>(false)

    useEffect(() => {
        const onMusicUpdates = async (data: SongData) => {
            setSongData(data)
            console.log('getting music', data.is_playing)
            setIsPlaying(data.is_playing)
            if (data.thumbnail && data.thumbnail !== thumbnail) {
                setThumbnail(data.thumbnail)
            }
        }
        
        const off = musicStore.on(onMusicUpdates)

        return () => {
            off()
        }
    })

    return (
        <div style={{background:`${songData ? songData.color?.rgba : 'rgb(0, 0, 0)'}`}} className="bg-slate-800 w-screen overflow-hidden h-screen flex justify-center items-center">
            <div className={`w-screen h-[100vw] ${isPlaying ? 'animate-spin-slow' : 'rotate-0'}`}>
                <div style={{backgroundImage:`url(./vinyl.svg)`}} className="border-black border- w-full h-full bg-cover bg-center bg-no-repeat " />
                <div style={{backgroundImage:`url(${songData?.thumbnail})`}} className="absolute blur-sm rounded-full left-1/4 top-1/4 border-black border-2 border- w-[50%] h-[50%] bg-cover bg-center bg-no-repeat " />
            </div>
            <div className="fixed flex justify-center items-center w-full">
                <div className={`${songData && songData.color?.isDark ? 'text-white' : 'text-black'} w-full absolute index-0`}>
                    <div className="flex flex-col justify-center w-full items-center">
                        <h1 className='text max-w-[75vw] w-full text-justify text-4xl font-bold'>
                            {songData?.track_name || 'Track Name'}
                        </h1>
                        <p className='text-2xl font-semibold text-justify font-mono'>
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
