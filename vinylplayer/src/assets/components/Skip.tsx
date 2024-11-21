import React from 'react'
import { DeskThing } from 'deskthing-client'
import SkipIcon from '../svgs/Skip'

const Skip: React.FC = () => {
  const deskthing = DeskThing.getInstance()

  const togglePlayPause = () => {
    deskthing.sendMessageToParent({
      type: 'action',
      app: 'client',
      payload: {id: 'skip', source: 'server'}
    })
  }

  return (
    <button onClick={togglePlayPause} className="p-4">
      <SkipIcon style={{color: 'var(--background-contrast)'}} iconSize={56} />
    </button>
  )
}

export default Skip