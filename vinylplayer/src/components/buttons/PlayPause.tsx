import React from 'react'
import IconPlay from '../../svgs/Play'
import IconPause from '../../svgs/Pause'
import { useMusicStore } from '../../stores/musicStore'

const PlayPause: React.FC = () => {
	const isPlaying = useMusicStore((state) => state.isPlaying)
	const playPause = useMusicStore((state) => state.playPause)

	return (
		<button onClick={playPause} style={{background: 'var(--background-contrast)'}} className="rounded-full p-2">
			{isPlaying ? <IconPause style={{color: 'var(--background-color)'}} iconSize={75} /> : <IconPlay style={{color: 'var(--background-color)'}} iconSize={75} />}
		</button>
	)
}

export default PlayPause