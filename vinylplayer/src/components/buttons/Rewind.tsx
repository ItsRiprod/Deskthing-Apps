import React from 'react'
import IconPrev from '../../svgs/Prev'
import { useMusicStore } from '../../stores/musicStore'

const Rewind: React.FC = () => {
	const rewind = useMusicStore((state) => state.rewind)
	const textColor = useMusicStore((state) => state.textColor)

	return (
		<button onClick={rewind} className="p-2">
			<IconPrev color={textColor} iconSize={50} />
		</button>
	)
}

export default Rewind