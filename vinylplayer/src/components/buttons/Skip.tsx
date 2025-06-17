import React from 'react'
import IconSkip from '../../svgs/Skip'
import { useMusicStore } from '../../stores/musicStore'

const Skip: React.FC = () => {
	const skip = useMusicStore((state) => state.skip)
	const textColor = useMusicStore((state) => state.textColor)

	return (
		<button onClick={skip} className="p-2">
			<IconSkip color={textColor} iconSize={50} />
		</button>
	)
}

export default Skip