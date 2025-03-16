import { FC } from "react"
import { useUI } from "../../hooks/useUI"

type RightPanelTypes = {
    className?: string
}

export const RightPanel: FC<RightPanelTypes> = ({ className }) => {
    const { panelState } = useUI()

    return (
        <div className={`w-5/12 h-full bg-neutral-900 ${className}`}>
            <div>{panelState}</div>
        </div>
    )
}