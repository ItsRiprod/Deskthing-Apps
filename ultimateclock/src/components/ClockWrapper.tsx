import { useSettingStore } from "@src/store/settingsStore";
import { ClockSettingIDs } from "@shared/index";
const CLOCK_POSITION_MAP: Record<
  string,
  {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    transform?: string;
    justifyContent?: string;
    alignItems?: string;
  }
> = {
  "top-left": { justifyContent: "flex-start", alignItems: "flex-start" },
  "top-right": { justifyContent: "flex-end", alignItems: "flex-start" },
  "bottom-left": { justifyContent: "flex-start", alignItems: "flex-end" },
  "bottom-right": { justifyContent: "flex-end", alignItems: "flex-end" },
  top: {  justifyContent: "center", alignItems: "flex-start" },
  left: {  justifyContent: "flex-start", alignItems: "center" },
  right: {  justifyContent: "flex-end", alignItems: "center" },
  bottom: {  justifyContent: "center", alignItems: "flex-end" },
  center: {  justifyContent: "center", alignItems: "center" },
};

export const ClockWrapper = ({ children }) => {
  const settings = useSettingStore((state) => state.settings);

  // Positioning settings
  const position = settings?.[ClockSettingIDs.CLOCK_POSITION] || "center";
  const positionStyle = CLOCK_POSITION_MAP[position] || {};

  // Container style for justify content and positioning
  const containerStyle: React.CSSProperties = {
    ...positionStyle,
    pointerEvents: "none", // Optional: allows clicks to pass through
  };

  return (
    <div style={containerStyle} className="flex relative w-full h-full">
      {children}
    </div>
  );
};
