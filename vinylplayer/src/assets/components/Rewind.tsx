import React from 'react'
import { DeskThing } from '@deskthing/client'
import RewindIcon from '../svgs/Rewind'
import { AUDIO_REQUESTS } from '@deskthing/types'

const Rewind: React.FC = () => {

  const togglePlayPause = () => {
    DeskThing.triggerAction({
      id: AUDIO_REQUESTS.REWIND,
      source: 'server',
      enabled: true
    })
  }

  return (
    <button onClick={togglePlayPause} className="p-4">
      <RewindIcon style={{color: 'var(--background-contrast)'}} iconSize={56} />
    </button>
  )
}

export default Rewind