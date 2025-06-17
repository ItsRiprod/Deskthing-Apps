import { FC } from "react"
import PlayPause from "./buttons/PlayPause"
import Rewind from "./buttons/Rewind"
import Skip from "./buttons/Skip"
import Shuffle from "./buttons/Shuffle"
import Repeat from "./buttons/Repeat"
import { useSettingStore } from "../stores/settingsStore"
import { CONTROLS } from "@shared/recordTypes"
import VolUp from "./buttons/VolUp"
import VolDown from "./buttons/VolDown"

export const PlaybackComponent: FC = () => {
	const settings = useSettingStore((state) => state.settings)
	const controls = settings?.controls?.value || []

	return (
		<div className="flex">
			{controls.includes(CONTROLS.VOL_DOWN) && <VolDown />}
			{controls.includes(CONTROLS.SHUFFLE) && <Shuffle />}
			{controls.includes(CONTROLS.PREVIOUS) && <Rewind />}
			{controls.includes(CONTROLS.PLAY_PAUSE) && <PlayPause />}
			{controls.includes(CONTROLS.NEXT) && <Skip />}
			{controls.includes(CONTROLS.REPEAT) && <Repeat />}
			{controls.includes(CONTROLS.VOL_UP) && <VolUp />}
		</div>
	)
}

export default PlaybackComponent