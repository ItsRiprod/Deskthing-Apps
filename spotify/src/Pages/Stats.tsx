import React, { useEffect, useState } from 'react'
import { AudioFeaturesResponse, SpotifyAudioAnalysis } from '../types/spotify'
import SpectrumAnalyzer from '../components/Analyzer'
import Card from '../components/Card'
import { IconArrowLeft } from '../assets/icons'
import { MusicStore } from '../Stores/musicStore'
import { Settings, SongData } from 'deskthing-client'
import Slider from '../components/Slider'
import { SettingsStore } from '../Stores/settingsStore'

interface StatsProps {
    visible: boolean
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}


const Stats: React.FC<StatsProps> = ({ visible, setVisible }) => {
    const musicStore = MusicStore.getInstance()
    const settingStore = SettingsStore.getInstance()
    const [songData, setSongData] = useState<SongData | null>(musicStore.getSong())
    const [analysis, setAnalysis] = useState<SpotifyAudioAnalysis | null>(musicStore.getAnalysisData())
    const [features, setFeatures] = useState<AudioFeaturesResponse | null>(musicStore.getFeaturesData())
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [spectrumData, setSpectrumData] = useState<number[]>([])
    const [stats, setStats] = useState(true)
    const [analysisEnabled, setAnalysisEnabled] = useState(settingStore.getSettings()?.spotify.analyzer.value === 'true' || false)

    useEffect(() => {
        const onAppData = async (data: SongData) => {
            setSongData(data)
            if (data.track_progress) {
                setCurrentTime(data.track_progress / 1000 + 1)
            }
        }

        const onAnalysisData = async (data: SpotifyAudioAnalysis) => {
            if (data?.meta?.status_code == 0) {
                setAnalysis(data as SpotifyAudioAnalysis)
            }
        }

        const onFeaturesData = async (data: AudioFeaturesResponse) => {
            if (data?.analysis_url) {
                setFeatures(data as AudioFeaturesResponse)
            }
        }

        const onSettingsUpdate = async (settings: Settings) => {
            if (settings) {
                if (settings.spotify.analyzer.value == 'true') {
                    setAnalysisEnabled(true)
                } else {
                    setAnalysisEnabled(false)
                }
            }
        }

        const removeA = musicStore.on('music', (a) => onAppData(a as SongData))
        const removeB = musicStore.on('analysis', (a) => onAnalysisData(a as SpotifyAudioAnalysis))
        const removeC = musicStore.on('features', (a) => onFeaturesData(a as AudioFeaturesResponse))
        const removeD = settingStore.on((settings) => onSettingsUpdate(settings as Settings))

        const timer = setInterval(() => {
            if (songData?.is_playing && visible && analysisEnabled || false) {
                setCurrentTime(prevTime => {
                    const newTime = prevTime + 0.1;
                    if (analysis?.segments) {
                        const currentSegment = analysis.segments.find(segment =>
                            segment.start <= newTime && segment.start + segment.duration > newTime
                        );
                        if (currentSegment) {
                            setSpectrumData(currentSegment.pitches.map(pitch => pitch * 100));
                        }
                    }
                    return newTime;
                });
            }
        }, 100)

        return () => {
            removeA()
            removeB()
            removeC()
            removeD()
            clearInterval(timer)
        }
    }, [analysis, visible])

    const toggleVisibility = () => {
        setVisible(!visible)
    }

    const getKeyName = (key: number): string => {
        const keyNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
        return keyNames[key] || 'Unknown';
    }

    const getModeName = (mode: number): string => {
        return mode === 1 ? 'Major' : 'Minor';
    }

    return (
        <>
            <div 
                className={`fixed w-1/2 h-screen flex flex-col justify-center items-center bg-gray-800 transition-all duration-300 ease-in-out ${
                    visible ? 'left-0' : '-left-2/4'
                }`}
            >
                <button className="w-full h-full"
                onClick={() => setStats(!stats)}>
                {stats ? 
                        <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-4 p-4">
                        {analysis?.track.key !== undefined && <Card title={'Key'} value={getKeyName(analysis.track.key)} />}
                        {analysis?.track.tempo !== undefined && <Card title={'BPM'} value={analysis.track.tempo.toString()} />}
                        {analysis?.track.loudness !== undefined && <Card title={'Overall Loudness'} value={analysis.track.loudness.toString()} />}
                        {analysis?.track.mode !== undefined && <Card title={'Mode'} value={getModeName(analysis.track.mode)} />}
                </div>
                        : 
                        <div className="grid grid-cols-2 grid-rows-4 w-full h-full gap-4 p-4">
                        <Slider title={'Acoustic'} value={features?.acousticness || 0} />
                        <Slider title={'Energetic'} value={features?.energy || 0} />
                        <Slider title={'Danceable'} value={features?.danceability || 0} />
                        <Slider title={'Instrumental'} value={features?.instrumentalness || 0} />
                        <Slider title={'Loudness'} value={features?.loudness || 0} />
                        <Slider title={'Lively'} value={features?.liveness || 0} />
                        <Slider title={'Speechful'} value={features?.speechiness || 0} />
                        <Slider title={'Valence'} value={features?.valence || 0} />
                    </div>
                }
                </button>
                {analysisEnabled && <SpectrumAnalyzer spectrumData={spectrumData} playing={songData?.is_playing && visible || false} />}
                
                <div className={`absolute ${visible ? '-right-1/3 opacity-100' : '-right-0 opacity-0'} transition-all duration-500 ease-in-out`}>
                    <IconArrowLeft iconSize={124} />
                </div>
            </div>
            <button
                className={`fixed flex justify-end items-center ${visible ? 'w-1/2 left-1/2' : 'w-1/3 left-0'} transition-all duration-300 h-full z-10 text-black`}
                onClick={toggleVisibility}>
            </button>
        </>
    )
}
export default Stats