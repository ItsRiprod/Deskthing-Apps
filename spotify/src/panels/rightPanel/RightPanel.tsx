import { FC } from "react"
import { useUI } from "../../hooks/useUI"

type RightPanelTypes = {
    className?: string
}

export const RightPanel: FC<RightPanelTypes> = ({ className }) => {
    const { panelState } = useUI()

    return (
        <div className={`w-2/6 h-full bg-zinc-500 ${className}`}>
            <div>{panelState}</div>
        </div>
    )
}