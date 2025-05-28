
import { SongData } from "@deskthing/types"
import { CONTROL_OPTIONS, DISPLAY_ITEMS } from "@shared/spotifyTypes"
import { useUI } from "@src/hooks/useUI"
import { FC } from "react"
import { Controls } from "./Controls"

type ThumbnailComponentProps = {
    currentSong: SongData
}

export const ThumbnailComponent: FC<ThumbnailComponentProps> = ({ currentSong }) => {
    const { controlOptions, displayItems } = useUI()
    return (
        <div className="p-4 group flex justify-center items-center">
            {displayItems.includes(DISPLAY_ITEMS.THUMBNAIL) && (
                <img
                    style={{ maxHeight: '80vh' }}
                    className={`max-w-[30vw] rounded-xl drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
                    src={currentSong?.thumbnail ?? ''}
                    alt={`${currentSong.album} cover`}
                />)}
            {displayItems.includes(DISPLAY_ITEMS.CONTROLS) && controlOptions == CONTROL_OPTIONS.THUMBNAIL && (
                <div className={`absolute max-w-[30vw] opacity-0 group-hover:opacity-100`}>
                    <Controls isPlaying={currentSong?.is_playing} isLight={currentSong?.color?.isLight || false} />
                </div>
            )}
        </div>
    )
}
