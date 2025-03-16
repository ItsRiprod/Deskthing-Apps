import Button from "@src/components/Button"
import { useUI } from "../../hooks/useUI";
import { Playlists } from "./Playlists";
import { Queue } from "./Queue";
import { IconArrowRight } from "@src/assets/icons"
import { PanelState } from "@src/contexts/UIContext"

type LeftPanelTypes = {
  className?: string;
};

export const LeftPanel = ({ className }: LeftPanelTypes) => {
  const { panelState, setPanelState } = useUI();

  const handleButtonClick = (state: PanelState) => {
    setPanelState(state);
  }

  const otherState = panelState === "Queue" ? "Playlists" : "Queue";

  return (
    <div
      className={`w-5/12 h-screen flex-col items-center bg-neutral-950 flex ${className}`}
    >
      <div className="h-24 w-full flex items-center justify-between p-4">
        <h1 className="text-2xl text-zinc-200 font-bold">{panelState}</h1>
        <Button onClick={() => handleButtonClick(otherState)} className="p-2 rounded-xl text-zinc-300 items-center bg-neutral-900">
            <p className="text-lg font-geist">{otherState}</p>
            <IconArrowRight />
        </Button>
      </div>
      <div className="max-h-full w-full overflow-y-hidden">
        {panelState === "Playlists" && <Playlists />}
        {panelState === "Queue" && <Queue />}
      </div>
    </div>
  );
};
