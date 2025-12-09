import { useEffect } from "react";
import { useUIStore } from "../stores/uiStore";
import { useCallStore } from "@src/stores/callStore";
import { AppSettingIDs, CONTROL_SIZE, DASHBOARD_ELEMENTS, PANEL_ELEMENTS } from "@shared/types/discord";
import { XL_CONTROLS_ENABLED, getControlLayout } from "@src/constants/xlControls";

const SizeListener = () => {
  const setDimensions = useUIStore((s) => s.setDimensions);
  const widgets = useUIStore((s) => s.widgets);
  const leftPanel = useUIStore((s) => s.leftPanel);
  const rightPanel = useUIStore((s) => s.rightPanel);
  const settings = useUIStore((s) => s.settings);
  const callConnected = useCallStore((s) => s.callStatus?.isConnected ?? false);

  const controlSizeSetting =
    (settings?.[AppSettingIDs.CONTROLS_SIZE]?.value as CONTROL_SIZE | undefined) ??
    CONTROL_SIZE.MEDIUM;

  useEffect(() => {
    const hasCallControls = widgets.includes(DASHBOARD_ELEMENTS.CALL_CONTROLS) && callConnected;
    const isSinglePanel =
      leftPanel === PANEL_ELEMENTS.BLANK || rightPanel === PANEL_ELEMENTS.BLANK;
    const controlLayout = getControlLayout(controlSizeSetting);
    const controlHeight = XL_CONTROLS_ENABLED ? controlLayout.totalHeight : 75;

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
  }, [setDimensions, widgets, leftPanel, rightPanel, controlSizeSetting, callConnected]);

  return null;
};

export default SizeListener;
