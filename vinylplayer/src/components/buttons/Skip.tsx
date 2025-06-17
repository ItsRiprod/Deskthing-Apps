import React from 'react'
import { DeskThing } from '@deskthing/client'
import IconSkip from '../../svgs/Skip'
import { AUDIO_REQUESTS } from '@deskthing/types'

const Skip: React.FC = () => {

	const Skip = () => {
		DeskThing.triggerAction({
			id: "skip",
			source: 'server'
		})
	}

	return (
		<button onClick={Skip} className="p-2">
			<IconSkip style={{color: 'var(--background-contrast)'}} iconSize={50} />
		</button>
	)
}

export default Skip