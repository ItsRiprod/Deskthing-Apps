import React, { useEffect, useState } from 'react'
import { DeskThing } from '@deskthing/client'
import { AUDIO_REQUESTS, SocketData, SongData } from '@deskthing/types'
import PlayIcon from '../svgs/Play'
import PauseIcon from '../svgs/Pause'

const PlayPause: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const handlePlayStateChange = async (musicData: SocketData) => {
      const songData = musicData.payload as SongData
      setIsPlaying(songData.is_playing)
    }

    const listener = DeskThing.on('music', handlePlayStateChange)

    return () => {
      listener()
    }
  }, [DeskThing])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)

    DeskThing.triggerAction({
      id: AUDIO_REQUESTS.PLAY,
      source: 'server',
      enabled: true
    })
  }

  return (
    <button onClick={togglePlayPause} style={{background: 'var(--background-contrast)'}} className="rounded-full p-4">
      {isPlaying ? <PauseIcon style={{color: 'var(--background-color)'}} iconSize={56} /> : <PlayIcon style={{color: 'var(--background-color)'}} iconSize={56} />}
    </button>
  )
}

export default PlayPause