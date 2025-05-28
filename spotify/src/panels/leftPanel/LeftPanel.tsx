import Button from "@src/components/Button"
import { useUI } from "../../hooks/useUI";
import { Playlists } from "./Playlists";
import { Queue } from "./Queue";
import { ListMusic, ListStart, X } from "lucide-react";
import { PanelState } from "@src/contexts/UIContext"

type LeftPanelTypes = {
  className?: string;
  clickable?: boolean;
};

export const LeftPanel = ({ className, clickable = true }: LeftPanelTypes) => {
  const { panelState, setPanelState, setPanel } = useUI();

  const handleButtonClick = (state: PanelState) => {
    if (!clickable) return;
    setPanelState(state);
  }

  const handleClose = () => {
    setPanel(null);
  }

  const otherState = panelState === "Queue" ? "Playlists" : "Queue";
  const Icon = otherState === "Playlists" ? ListMusic : ListStart;

  return (
    <div
      className={`sm:w-5/12 w-full h-screen flex-col items-center bg-neutral-950 flex border-neutral-800 border-r-2 ${className}`}
      style={{ pointerEvents: clickable ? 'auto' : 'none' }}
    >
      <button className="sm:hidden absolute top-4 right-4" onClick={handleClose}>
        <X className="w-6 h-6 text-white" />
      </button>
      <div className="w-full sm:flex-row flex-col  flex sm:items-center justify-between p-4">
        <h1 className="font-geist text-2xl text-neutral-200 font-bold">{panelState}</h1>
        <Button onClick={() => handleButtonClick(otherState)} className="py-3 px-5 rounded-xl text-neutral-300 items-center bg-neutral-900">
            <Icon className="w-6 h-6" />
            <p className="text-lg font-medium font-geist pl-1">{otherState}</p>
        </Button>
      </div>
      <div className="max-h-full w-full overflow-y-hidden">
        {panelState === "Playlists" && <Playlists />}
        {panelState === "Queue" && <Queue />}
      </div>
    </div>
  );
};