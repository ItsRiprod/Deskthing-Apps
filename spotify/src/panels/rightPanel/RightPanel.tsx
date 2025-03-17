import { FC } from "react"
import { useUI } from "../../hooks/useUI"
import { Presets } from "./Presets"

type RightPanelTypes = {
    className?: string
    clickable?: boolean
}

export const RightPanel: FC<RightPanelTypes> = ({ className, clickable = true }) => {
    const { panelState } = useUI()

    return (
        <div
        className={`w-5/12 h-screen flex-col items-center bg-neutral-950 flex ${className}`}
        style={{ pointerEvents: clickable ? 'auto' : 'none' }}
      >
        <div className="h-24 w-full flex items-center justify-between p-4">
          <h1 className="text-2xl text-zinc-200 font-bold">{panelState}</h1>
        </div>
        <div className="max-h-full w-full overflow-y-hidden">
          <Presets />
        </div>
      </div>
    )
}