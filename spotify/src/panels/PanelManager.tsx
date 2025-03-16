import ArrowLeft from "../assets/icons/ArrowLeft";
import { useUI } from "../hooks/useUI";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";

export const PanelManager = () => {
  const { panel, setPanel } = useUI();

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;
    setPanel(isRightSide ? "right" : "left");
  };

  return (
    <div
      className="absolute w-screen overflow-hidden h-screen z-50 flex justify-between"
      onClick={handleClick}
    >
      <LeftPanel
        className={`${panel === "left" ? "animate-slide-in-left" : "animate-slide-out-left"}`}
      />
      <div className="absolute w-full items-center justify-center h-full flex">
        <ArrowLeft
          iconSize="100px"
          className={`${panel == null ? "opacity-0 rotate-90" : panel == "right" ? "rotate-180 -translate-x-12" : "translate-x-12"} transition-all`}
        />
      </div>
      <RightPanel
        className={`${panel === "right" ? "animate-slide-in-right" : "animate-slide-out-right"}`}
      />
    </div>
  );
};
