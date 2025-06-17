import React, {useState} from 'react'
import { DeskThing } from '@deskthing/client'
import IconShuffle from '../../svgs/Shuffle'
import { AUDIO_REQUESTS } from '@deskthing/types'

const Shuffle: React.FC = () => {
	const [shuffle, setShuffle] = useState(false)

	const Shuffle = () => {
		const newShuffle = !shuffle
		setShuffle(newShuffle)
		const shuffleIcon = document.getElementById('shuffle_ico') as HTMLElement | null;
		
		if (shuffleIcon && shuffleIcon.style) {
			shuffleIcon.style.color = newShuffle ? '#1cd660ff' : 'white';
		}

		DeskThing.triggerAction({
			id: AUDIO_REQUESTS.SHUFFLE,
			source: 'server',
			enabled: true
		})
	}

	return (
		<button onClick={Shuffle} className="p-2">
			<IconShuffle id="shuffle_ico" style={{color: 'white'}} iconSize={45} />
		</button>
	)
}

export default Shuffle