import React, { useEffect, useState } from 'react'
import { MusicStore } from '../../Stores/musicStore'
import { DeskThing } from 'deskthing-client'
import { SongData } from 'deskthing-client/dist/types'
import PlayIcon from '../svgs/Play'
import PauseIcon from '../svgs/Pause'

const PlayPause: React.FC = () => {
  const musicStore = MusicStore.getInstance()
  const deskthing = DeskThing.getInstance()
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const handlePlayStateChange = async (musicData: SongData) => {
      setIsPlaying(musicData.is_playing)
    }

    const listener = musicStore.on(handlePlayStateChange)

    return () => {
      listener()
    }
  }, [musicStore])

  const togglePlayPause = () => {
    musicStore.setPlay(!isPlaying)

    deskthing.sendMessageToParent({
      type: 'action',
      app: 'client',
      payload: {id: 'play', source: 'server'}
    })
  }

  return (
    <button onClick={togglePlayPause} style={{background: 'var(--background-contrast)'}} className="rounded-full p-4">
      {isPlaying ? <PauseIcon style={{color: 'var(--background-color)'}} iconSize={56} /> : <PlayIcon style={{color: 'var(--background-color)'}} iconSize={56} />}
    </button>
  )
}

export default PlayPause