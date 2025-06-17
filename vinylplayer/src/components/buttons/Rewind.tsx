import React from 'react'
import { DeskThing } from '@deskthing/client'
import IconPrev from '../../svgs/Prev'
import { AUDIO_REQUESTS } from '@deskthing/types'

const Rewind: React.FC = () => {

	const Rewind = () => {
		DeskThing.triggerAction({
			id: "rewind",
			source: 'server'
		})
	}

	return (
		<button onClick={Rewind} className="p-2">
			<IconPrev style={{color: 'var(--background-contrast)'}} iconSize={50} />
		</button>
	)
}

export default Rewind