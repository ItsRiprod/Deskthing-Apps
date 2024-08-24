import React, { useEffect, useState } from 'react'
import { MusicStore } from '../Stores/musicStore'
import { SongData } from 'deskthing-client/dist/types'
import { findAlbumArtColor } from '../Utils/colorUtils'

const Record: React.FC = () => {
    const musicStore = MusicStore.getInstance()
    const [songData, setSongData] = useState<SongData | null>(musicStore.getSong())
    const [thumbnail, setThumbnail] = useState<string>(songData?.thumbnail || '')
    const [backgroundImage, setBackgroundImage] = useState<string>('rgb(0,0,0)')

    useEffect(() => {
        const onMusicUpdates = async (data: SongData) => {
            setSongData(data)
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
            const imageElement = new Image();
            imageElement.src = thumbnail;
            imageElement.onload = () => {
                findAlbumArtColor(imageElement).then((avgColor) => {
                    setBackgroundImage(avgColor || 'rgb(0,0,0)')
                    console.log('Average color:', avgColor)
                })
            }
        }
    }, [thumbnail])

    return (
        <div style={{background:`${backgroundImage}`}} className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            <div className={`fixed left-1/4 -bottom-3/4 rounded-full w-[180vw] h-[180vw] ${songData?.is_playing && 'animate-spin-slow'}`}>
                <div style={{backgroundImage:`url(./vinyl.svg)`}} className="absolute rounded-full border-black border- w-full h-full bg-cover bg-center bg-no-repeat " />
                <div style={{backgroundImage:`url(${thumbnail})`}} className="absolute rounded-full left-1/4 top-1/4 border-black border-2 border- w-[50%] h-[50%] bg-cover bg-center bg-no-repeat " />
            </div>
            <div className="fixed top-5 left-5">
                <h1 className="text-white text-4xl font-bold">
                    {songData?.track_name}
                </h1>
                <p className="text-white text-2xl font-semibold">
                    {songData?.artist}
                </p>
            </div>
            <div>

            </div>
        </div>

    )
}

export default Record
