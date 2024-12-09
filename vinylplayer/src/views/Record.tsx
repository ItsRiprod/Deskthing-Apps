import React, { useEffect, useState } from 'react'
import { MusicStore } from '../Stores/musicStore'
import { SongData } from 'deskthing-client'
import PlayPause from '../assets/components/PlayPause'
import Skip from '../assets/components/Skip'
import Rewind from '../assets/components/Rewind'

const Record: React.FC = () => {
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
        <div style={{background:`${songData ? songData.color?.rgba : 'rgb(0, 0, 0)'}`}} className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            <div className={`fixed left-1/4 -bottom-3/4 rounded-full w-[180vw] h-[180vw] ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <div style={{backgroundImage:`url(./vinyl.svg)`}} className="absolute border-black border- w-full h-full bg-cover bg-center bg-no-repeat " />
                <div style={{backgroundImage:`url(${thumbnail})`}} className="absolute rounded-full left-1/4 top-1/4 border-black border-2 border- w-[50%] h-[50%] bg-cover bg-center bg-no-repeat " />
            </div>
            <div className="fixed top-7 left-7">
                <h1 style={{color: 'var(--background-contrast)'}} className="text-4xl font-bold">
                    {songData?.track_name}
                </h1>
                <p style={{color: 'var(--background-contrast)'}} className="text-2xl font-semibold font-mono">
                    {songData?.artist}
                </p>
            </div>
            <div className="fixed bottom-5 left-5">
                <Rewind />
                <PlayPause />
                <Skip />
            </div>
        </div>

    )
}

export default Record
