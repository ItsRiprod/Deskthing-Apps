import { FC } from "react"
import PlayPause from "./buttons/PlayPause"
import Rewind from "./buttons/Rewind"
import Skip from "./buttons/Skip"
import Shuffle from "./buttons/Shuffle"
import Repeat from "./buttons/Repeat"

export const PlaybackComponent: FC = () => {

	return (
		<div className="flex">
			<Shuffle />
			<Rewind />
			<PlayPause />
			<Skip />
			<Repeat />
		</div>
	)
}

export default PlaybackComponent