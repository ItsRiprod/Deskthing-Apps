import { useEffect } from "react";
import { useUIStore } from "../stores/uiStore";
import { DASHBOARD_ELEMENTS, PANEL_ELEMENTS } from "@shared/types/discord";
import { XL_CONTROL_TOTAL_HEIGHT, XL_CONTROLS_ENABLED } from "@src/constants/xlControls";

const SizeListener = () => {
  const setDimensions = useUIStore((s) => s.setDimensions);
  const widgets = useUIStore((s) => s.widgets);
  const leftPanel = useUIStore((s) => s.leftPanel);
  const rightPanel = useUIStore((s) => s.rightPanel);

  useEffect(() => {
    const hasCallControls = widgets.includes(DASHBOARD_ELEMENTS.CALL_CONTROLS);
    const isSinglePanel =
      leftPanel === PANEL_ELEMENTS.BLANK || rightPanel === PANEL_ELEMENTS.BLANK;
    const controlHeight = XL_CONTROLS_ENABLED ? XL_CONTROL_TOTAL_HEIGHT : 75;

    const updateDimensions = () => {
      const controlsHeight = hasCallControls ? controlHeight : 0;
      const panelWidth = window.innerWidth / (isSinglePanel ? 1 : 2);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        panel: {
          width: panelWidth,
          height: Math.max(window.innerHeight - controlsHeight, 0),
        },
        controls: {
          width: window.innerWidth,
          height: controlsHeight,
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
