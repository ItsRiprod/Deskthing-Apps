import React, { useEffect, useState } from 'react'
import { MusicStore } from '../Stores/musicStore'
import { SongData } from 'deskthing-client/dist/types'
import { findAlbumArtColor } from '../Utils/colorUtils'
import PlayPause from '../assets/components/PlayPause'
import Skip from '../assets/components/Skip'
import Rewind from '../assets/components/Rewind'

const RecordCenter: React.FC = () => {
    const musicStore = MusicStore.getInstance()
    const [songData, setSongData] = useState<SongData | null>(musicStore.getSong())
    const [thumbnail, setThumbnail] = useState<string>(songData?.thumbnail || '')
    const [backgroundImage, setBackgroundImage] = useState<string>('rgb(0,0,0)')
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
            const imageElement = new Image();
            imageElement.src = thumbnail;
            imageElement.onload = () => {
                findAlbumArtColor(imageElement).then((avgColor) => {
                    if (avgColor) {
                        const [r, g, b] = avgColor
                        const color = `rgb(${r}, ${g}, ${b})`
                        document.documentElement.style.setProperty('--background-color', color)
                        setBackgroundImage(color)
                        console.log('Average color:', color)

                        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                        const contrastColor = luminance > 0.7 ? 'black' : 'white';
                        document.documentElement.style.setProperty('--background-contrast', contrastColor);
                    } else {
                        const defaultColor = 'rgb(0,0,0)';
                        document.documentElement.style.setProperty('--background-color', defaultColor);
                        setBackgroundImage(defaultColor);
                        document.documentElement.style.setProperty('--background-contrast', 'white');
                        console.log('Default color:', defaultColor);
                    }
                })
            }
        }
    }, [thumbnail, musicStore])

    return (
        <div style={{background:`${backgroundImage}`}} className="bg-slate-800 w-screen overflow-hidden h-screen flex justify-center items-center">
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
