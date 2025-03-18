import Button from "@src/components/Button"
import { useUI } from "../../hooks/useUI";
import { Playlists } from "./Playlists";
import { Queue } from "./Queue";
import { IconArrowRight } from "@src/assets/icons";
import { ListMusic, ListStart } from "lucide-react";
import { PanelState } from "@src/contexts/UIContext"

type LeftPanelTypes = {
  className?: string;
  clickable?: boolean;
};

export const LeftPanel = ({ className, clickable = true }: LeftPanelTypes) => {
  const { panelState, setPanelState } = useUI();

  const handleButtonClick = (state: PanelState) => {
    if (!clickable) return;
    setPanelState(state);
  }

  const otherState = panelState === "Queue" ? "Playlists" : "Queue";
  const Icon = otherState === "Playlists" ? ListMusic : ListStart;

  return (
    <div
      className={`w-5/12 h-screen flex-col items-center bg-neutral-950 flex ${className}`}
      style={{ pointerEvents: clickable ? 'auto' : 'none' }}
    >
      <div className="w-full flex items-center justify-between p-4">
        <h1 className="font-geist text-2xl text-neutral-200 font-bold">{panelState}</h1>
        <Button onClick={() => handleButtonClick(otherState)} className="py-2 px-4 rounded-xl text-neutral-300 items-center bg-neutral-900">
            <Icon className="w-5 h-5" />
            <p className="font-medium font-geist pl-1">{otherState}</p>
        </Button>
      </div>
      <div className="max-h-full w-full overflow-y-hidden">
        {panelState === "Playlists" && <Playlists />}
        {panelState === "Queue" && <Queue />}
      </div>
    </div>
  );
};