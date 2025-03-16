import { useEffect } from "react";
import ArrowLeft from "../assets/icons/ArrowLeft";
import { useUI } from "../hooks/useUI";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";

export const PanelManager = () => {
  const { panel, setPanel } = useUI();

  const switchPanel = (isRightSide: boolean) => {
    const newState = isRightSide ? 'right' : 'left'
    console.log('Switching to ', newState)
    setPanel((state) => state == newState ? newState : state == null ? newState : null);
  }

  useEffect(() => {
    let touchHappened = false;
    let touchTimer: NodeJS.Timeout;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchHappened = true;
      clearTimeout(touchTimer);
      
      const clientX = e.touches[0].clientX;
      const isRightSide = clientX > window.innerWidth / 2;
      switchPanel(isRightSide)
      
      // Reset the flag after a delay longer than the click event would take to fire
      touchTimer = setTimeout(() => {
        touchHappened = false;
      }, 500);
    };
    
    const handleClick = (e: MouseEvent) => {
      // Skip if this was triggered by a touch
      if (touchHappened) return;
      
      const isRightSide = e.clientX > window.innerWidth / 2;
      switchPanel(isRightSide)
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('click', handleClick);
      clearTimeout(touchTimer);
    };
  }, [setPanel]);

  return (
    <div className="fixed top-0">

    <div className="relative max-h-screen h-screen w-screen overflow-x-hidden">
      <LeftPanel
        className={`absolute ${panel === "left" ? "animate-slide-in-left" : "animate-slide-out-left"}`}
        />
      <div className="w-full absolute pointer-events-none items-center justify-center h-full flex">
        <ArrowLeft
          iconSize="100px"
          className={`${panel == null ? "opacity-0 rotate-90" : panel == "right" ? "rotate-180 -translate-x-12" : "translate-x-12"} transition-all`}
          />
      </div>
      <RightPanel
        className={`absolute right-0 ${panel === "right" ? "animate-slide-in-right" : "animate-slide-out-right"}`}
        />
    </div>
        </div>
  );
};
