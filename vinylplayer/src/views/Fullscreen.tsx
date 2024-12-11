import React, { useEffect, useState } from 'react'
import { MusicStore } from '../Stores/musicStore'
import { SongData } from 'deskthing-client'
import PlayPause from '../assets/components/PlayPause'
import Skip from '../assets/components/Skip'
import Rewind from '../assets/components/Rewind'

const Fullscreen: React.FC = () => {
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

    useEffect(() => {
        if (thumbnail) {
            
        }
    }, [thumbnail, musicStore])

    return (
        <div style={{background:`${songData ? songData.color?.rgba : 'rgb(0, 0, 0)'}`}} className="bg-slate-800 w-screen h-screen overflow-hidden flex justify-center items-center">
            <div style={{backgroundImage:`url(${songData?.thumbnail})`}} className={`${songData && songData.color?.isDark ? 'text-white' : 'text-black'} absolute blur-sm border-black border-2 border- w-[100%] h-[100%] bg-cover bg-center bg-no-repeat`} />
            <div className="fixed flex justify-center items-center">
                <div className={`${songData && songData.color?.isDark ? 'text-white' : 'text-black'} index-0 flex justify-around w-screen`}>
                    <div>
                        <div style={{backgroundImage:`url(${thumbnail})`}} className="border-black border-2 border- w-[75vh] h-[75vh] bg-cover bg-center bg-no-repeat " />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <h1 className={` text-center text-4xl font-bold`}>
                            {songData?.track_name}
                        </h1>
                        <p className={` text-2xl font-semibold font-mono`}>
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
