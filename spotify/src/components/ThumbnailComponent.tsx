
import { SongData } from "@deskthing/types"
import { FC } from "react"
import { useUI } from "@src/hooks/useUI"

type ThumbnailComponentProps = {
    currentSong: SongData
}

export const ThumbnailComponent: FC<ThumbnailComponentProps> = ({ currentSong }) => {
    const { thumbnailSize } = useUI()

    const sizeClasses = {
        'small': 'max-w-[30vw]',
        'medium': 'max-w-[36vw]',
        'large': 'max-w-[42vw]'
    }

    return (
        <div className="p-4 flex justify-center items-center">
            <img 
                style={{ maxHeight: '80vh' }} 
                className={`${sizeClasses[thumbnailSize]} rounded-xl drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]`} 
                src={currentSong?.thumbnail ?? ''} 
                alt={`${currentSong.album} cover`} 
            />
        </div>
    )
}
