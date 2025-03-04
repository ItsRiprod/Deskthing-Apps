import React from 'react'
import { DeskThing } from '@deskthing/client'
import SkipIcon from '../svgs/Skip'
import { AUDIO_REQUESTS } from '@deskthing/types'

const Skip: React.FC = () => {

  const togglePlayPause = () => {
    DeskThing.triggerAction({
      id: AUDIO_REQUESTS.NEXT,
      source: 'server',
      enabled: true
    })
  }

  return (
    <button onClick={togglePlayPause} className="p-4">
      <SkipIcon style={{color: 'var(--background-contrast)'}} iconSize={56} />
    </button>
  )
}

export default Skip