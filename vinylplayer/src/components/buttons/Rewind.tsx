import React from 'react'
import IconPrev from '../../svgs/Prev'
import { useMusicStore } from '../../stores/musicStore'

const Rewind: React.FC = () => {
	const rewind = useMusicStore((state) => state.rewind)
	const color = useMusicStore((state) => state.color)

	return (
		<button onClick={rewind} className="p-2">
			<IconPrev style={{color: color.isDark ? 'white' : 'black'}} iconSize={50} />
		</button>
	)
}

export default Rewind