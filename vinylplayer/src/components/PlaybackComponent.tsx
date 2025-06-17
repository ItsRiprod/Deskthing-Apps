import { DEVICE_CLIENT, SongData } from "@deskthing/types"
import { FC, useEffect, useState } from "react"
import { DeskThing } from "@deskthing/client"
import PlayPause from "./buttons/PlayPause"
import Rewind from "./buttons/Rewind"
import Skip from "./buttons/Skip"
import Shuffle from "./buttons/Shuffle"
import Repeat from "./buttons/Repeat"

export const PlaybackComponent: FC<JSX.Element> = ({}) => {

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