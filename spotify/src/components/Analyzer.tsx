import React from 'react'
import { MusicStore } from '../Stores/musicStore'

interface SpectrumAnalyzerProps {
    spectrumData: number[]
    playing: boolean
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ spectrumData, playing }) => {
    const musicStore = MusicStore.getInstance()
    const backgroundColor = musicStore.getBackgroundColor()

    return (
        <>
            <div className="w-full h-full rounded-lg mb-4 flex items-end">
                {spectrumData.map((value, index) => (
                    <div
                        key={index}
                        className="w-1/12 transition-all flex flex-col justify-end items-center"
                        style={{height: `${playing ? value : 50}%`, background: `rgb(${backgroundColor.join(',')})`}}
                    >
                    </div>
                ))}
            </div>
        </>
    )
}

export default SpectrumAnalyzer
