import React from 'react'
import { DeskThing } from 'deskthing-client'
import RewindIcon from '../svgs/Rewind'

const Rewind: React.FC = () => {
  const deskthing = DeskThing.getInstance()

  const togglePlayPause = () => {
    deskthing.sendMessageToParent({
      type: 'action',
      app: 'client',
      payload: {id: 'rewind', source: 'server'}
    })
  }

  return (
    <button onClick={togglePlayPause} className="p-4">
      <RewindIcon style={{color: 'var(--background-contrast)'}} iconSize={56} />
    </button>
  )
}

export default Rewind