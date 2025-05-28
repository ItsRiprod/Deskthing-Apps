import { SongData } from "@deskthing/types"
import { ScrollingText } from "./ScrollingText"
import { FC } from "react"
import { useUI } from "@src/hooks/useUI"

type TextComponentProps = {
    currentSong: SongData
}

export const TextComponent: FC<TextComponentProps> = ({ currentSong }) => {

    const { textSetting } = useUI()

    if (textSetting === "minimal") {
        return (
            <div className="pl-5 h-[35vw] flex flex-col justify-center relative">
                <h1 className="text-[5vw] font-bold">
                    <ScrollingText text={currentSong.track_name} fadeWidth={24} />
                </h1>
            </div>
        )
    }

    return (
        <div className="pl-5 h-[35vw] flex flex-col justify-center relative">
            <p className="text-[2.25vw] font-mono opacity-80">
                {currentSong.album}
            </p>
            <h1 className="text-[5vw] font-bold">
                <ScrollingText text={currentSong.track_name} fadeWidth={24} />
            </h1>
            <h1 className="text-[2.75vw]">
                {currentSong.artist}
            </h1>

        </div>
    )
}