import { FC } from "react"
import { Presets } from "./Presets"

type RightPanelTypes = {
    className?: string
    clickable?: boolean
}

export const RightPanel: FC<RightPanelTypes> = ({ className, clickable = true }) => {

    return (
        <div
        className={`w-5/12 h-screen flex-col items-center bg-neutral-950 flex border-neutral-800 border-l-2 ${className}`}
        style={{ pointerEvents: clickable ? 'auto' : 'none' }}
      >
        <div className="h-[72px] w-full flex items-center justify-between p-4">
          <h1 className="font-geist text-2xl text-neutral-200 font-bold">Presets</h1>
          
        </div>
        <div className="max-h-full w-full overflow-y-hidden">
          <Presets />
        </div>
      </div>
    )
}