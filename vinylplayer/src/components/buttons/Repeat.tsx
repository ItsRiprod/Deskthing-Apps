import React, { useState } from 'react'
import { DeskThing } from '@deskthing/client'
import IconRepeat from '../../svgs/Repeat'
import { AUDIO_REQUESTS } from '@deskthing/types'

const RepeatButton: React.FC = () => {
	const [repeat, setRepeat] = useState(false)

	const toggleRepeat = () => {
		const newRepeat = !repeat
		setRepeat(newRepeat)

		const repeatIcon = document.getElementById('repeat_ico') as HTMLElement | null;

		if (repeatIcon && repeatIcon.style) {
			repeatIcon.style.color = newRepeat ? '#1cd660ff' : 'white';
		}

		DeskThing.triggerAction({
			id: AUDIO_REQUESTS.REPEAT,
			source: 'server',
			enabled: newRepeat
		})
	}

	return (
		<button onClick={toggleRepeat} className="p-2">
			<IconRepeat id="repeat_ico" style={{ color: 'white' }} iconSize={45} />
		</button>
	)
}

export default RepeatButton
