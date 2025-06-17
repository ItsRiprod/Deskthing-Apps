import React, { useEffect, useState } from 'react'
import IconShuffle from '../../svgs/Shuffle'
import { useMusicStore } from '@src/stores/musicStore'

const Shuffle: React.FC = () => {
	const [shuffle, setShuffle] = useState(false)
	const [iconColor, setIconColor] = useState('white')

	const updateShuffle = useMusicStore((state) => state.shuffle)
	const serverShuffle = useMusicStore((state) => state.songData?.shuffle_state)
	const textColor = useMusicStore((state) => state.textColor)

	useEffect(() => {
		setShuffle(serverShuffle ?? false)
		setIconColor(serverShuffle ? '#1cd660ff' : textColor)
	}, [serverShuffle])

	const toggleShuffle = () => {
		const newShuffle = !shuffle
		setShuffle((prev) => !prev)

		setIconColor(newShuffle ? '#1cd660ff' : textColor)

		updateShuffle()
	}

	return (
		<button onClick={toggleShuffle} className="p-2">
			<IconShuffle color={iconColor} iconSize={45} />
		</button>
	)
}

export default Shuffle