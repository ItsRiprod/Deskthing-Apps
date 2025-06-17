import React, { useEffect, useState } from 'react'
import IconShuffle from '../../svgs/Shuffle'
import { useMusicStore } from '@src/stores/musicStore'

const Shuffle: React.FC = () => {
	const [shuffle, setShuffle] = useState(false)
	const [iconColor, setIconColor] = useState('white')

	const updateShuffle = useMusicStore((state) => state.shuffle)
	const serverShuffle = useMusicStore((state) => state.songData?.shuffle_state)

	useEffect(() => {
		setShuffle(serverShuffle ?? false)
	}, [serverShuffle])

	const toggleShuffle = () => {
		const newShuffle = !shuffle
		setShuffle((prev) => !prev)

		setIconColor(newShuffle ? '#1cd660ff' : 'white')

		updateShuffle()
	}

	return (
		<button onClick={toggleShuffle} className="p-2">
			<IconShuffle style={{ color: iconColor }} iconSize={45} />
		</button>
	)
}

export default Shuffle