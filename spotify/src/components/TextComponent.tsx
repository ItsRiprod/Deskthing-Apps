import { SongData } from "@deskthing/types"
import { ScrollingText } from "./ScrollingText"
import { FC } from "react"
import { useUI } from "@src/hooks/useUI"
import { CONTROL_OPTIONS, DISPLAY_ITEMS } from "@shared/spotifyTypes"
import { ClockComponent } from "./ClockComponent"
import { Controls } from "./Controls"

type TextComponentProps = {
    currentSong: SongData
}

export const TextComponent: FC<TextComponentProps> = ({ currentSong }) => {

    const { displayItems, textJustification, controlOptions } = useUI()

    return (
        <div className={`pl-5 h-[35vw] flex flex-col justify-center ${textJustification == 'left' ? 'items-start' : textJustification == 'center' ? 'items-center' : 'items-end'} relative ${currentSong?.color?.isLight ? 'text-black' : 'text-white'}`}>
            {displayItems.includes(DISPLAY_ITEMS.ALBUM) && (
                <p className="text-[2.25vw] font-mono opacity-80">
                    {currentSong.album}
                </p>
            )}
            {displayItems.includes(DISPLAY_ITEMS.TITLE) && (
                <h1 className="text-[5vw] max-w-full overflow-ellipsis font-bold">
                    <ScrollingText text={currentSong.track_name} fadeWidth={24} />
                </h1>
            )}
            {displayItems.includes(DISPLAY_ITEMS.CLOCK) && (
                <ClockComponent currentSong={currentSong} />
            )}
            {displayItems.includes(DISPLAY_ITEMS.ARTISTS) && (
                <h1 className="text-[2.75vw]">
                    {currentSong.artist}
                </h1>
            )}

            {displayItems.includes(DISPLAY_ITEMS.CONTROLS) && controlOptions == CONTROL_OPTIONS.UNDER && (
                <div className={`w-full flex justify-center`}>
                        <Controls isPlaying={currentSong?.is_playing} isLight={currentSong?.color?.isLight || false} />
                </div>
            )}

        </div >
    )
}