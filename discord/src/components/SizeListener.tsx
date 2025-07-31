import { useEffect } from "react";
import { useUIStore } from "../stores/uiStore";
import { DASHBOARD_ELEMENTS, PANEL_ELEMENTS } from "@shared/types/discord";

const SizeListener = () => {
  const setDimensions = useUIStore((s) => s.setDimensions);
  const widgets = useUIStore((s) => s.widgets)
  const leftPanel = useUIStore((s) => s.leftPanel)
  const rightPanel = useUIStore((s) => s.rightPanel);

  useEffect(() => {
    const hasCallControls = widgets.includes(DASHBOARD_ELEMENTS.CALL_CONTROLS);

    const isSinglePanel = (leftPanel === PANEL_ELEMENTS.BLANK || rightPanel === PANEL_ELEMENTS.BLANK);
    
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        panel: {
          width: window.innerWidth / ( isSinglePanel ? 1 : 2 ),
          height: window.innerHeight - ( hasCallControls ? 75 : 0 ),
        },
        controls: {
          width: window.innerWidth,
          height: 75,
        },
      });
    };

    updateDimensions(); // Set initial dimensions

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [setDimensions, widgets, leftPanel, rightPanel]);

  return null;
};

export default SizeListener;