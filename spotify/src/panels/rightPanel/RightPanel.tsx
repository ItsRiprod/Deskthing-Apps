import { FC } from "react"
import { Presets } from "./Presets"
import { X } from "lucide-react"
import { useUI } from "@src/hooks/useUI"

type RightPanelTypes = {
  className?: string
  clickable?: boolean
}

export const RightPanel: FC<RightPanelTypes> = ({ className, clickable = true }) => {

  const { setPanel } = useUI();
  const handleClose = () => {
    setPanel(null);
  }

  return (
    <div
      className={`sm:w-5/12 w-full h-screen flex-col items-center bg-neutral-950 flex border-neutral-800 border-l-2 ${className}`}
      style={{ pointerEvents: clickable ? 'auto' : 'none' }}
    >
      <div className="h-[72px] w-full flex items-center justify-between p-4">
        <button className="sm:hidden" onClick={handleClose}>
          <X className="w-6 h-6 text-white" />
        </button>
        <h1 className="font-geist text-2xl text-neutral-200 font-bold">Presets</h1>

      </div>
      <div className="max-h-full w-full overflow-y-hidden">
        <Presets />
      </div>
    </div>
  )
}