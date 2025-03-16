import { useUI } from "../../hooks/useUI"
import { Playlists } from "./Playlists"
import { Queue } from "./Queue"

type LeftPanelTypes = {
    className?: string
}

export const LeftPanel = ({ className }: LeftPanelTypes) => {
    const { panelState } = useUI()

    return (
        <div className={`w-2/6 h-full items-center bg-zinc-500 flex ${className}`}>
            {panelState === "playlists" && <Playlists />}
            {panelState === "queue" && <Queue />}
        </div>
    )
}