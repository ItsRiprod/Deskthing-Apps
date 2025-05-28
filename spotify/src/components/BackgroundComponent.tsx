import { useMusic } from "@src/hooks/useMusic"
import { useUI } from "@src/hooks/useUI"
import { ReactNode } from "react"

type BackgroundComponentProps = {
    children: ReactNode
}

export const BackgroundComponent: React.FC<BackgroundComponentProps> = ({ children }) => {
    const { currentSong, backgroundColor } = useMusic()
    const { blurBackground, backdropBlurAmt } = useUI()
    if (blurBackground) {
        return (
            <div className="w-screen h-screen font-geist text-white flex relative"
                style={{ background: `linear-gradient(315deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%), ${backgroundColor}` }}>
                {currentSong?.thumbnail && (
                    <img 
                        className="absolute w-full h-full object-cover opacity-50" 
                        style={{ filter: `blur(${backdropBlurAmt ?? 10}px)` }}
                        src={currentSong.thumbnail} 
                        alt={`${currentSong.album} cover`} 
                    />
                )}
                {children}
            </div>
        )
    }

    return (
        <div className="w-screen h-screen font-geist text-white flex"
            style={{ background: `linear-gradient(315deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%), ${backgroundColor}` }}>
            {children}
        </div>
    )
}