import React from 'react'
import IconSkip from '../../svgs/Skip'
import { useMusicStore } from '../../stores/musicStore'

const Skip: React.FC = () => {
	const skip = useMusicStore((state) => state.skip)
	const color = useMusicStore((state) => state.color)

	return (
		<button onClick={skip} className="p-2">
			<IconSkip style={{color: color.isDark ? 'white' : 'black'}} iconSize={50} />
		</button>
	)
}

export default Skip