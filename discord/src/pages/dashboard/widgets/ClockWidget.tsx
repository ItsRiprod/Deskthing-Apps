import { useUIStore } from "@src/stores/uiStore";
import { CLOCK_OPTIONS } from "@shared/types/discord";
import { useSongStore } from "@src/stores/songStore";

const clockPositionClasses = {
  [CLOCK_OPTIONS.TOP_LEFT]: "top-0 left-0 justify-start",
  [CLOCK_OPTIONS.TOP_RIGHT]: "top-0 right-0 justify-end",
  [CLOCK_OPTIONS.TOP_CENTER]: "top-0 left-0 w-full justify-center",
  [CLOCK_OPTIONS.CUSTOM]: "", // You can add custom logic here if needed
  [CLOCK_OPTIONS.DISABLED]: "hidden",
};

export const ClockWidget = () => {
  const currentTime = useUIStore((state) => state.currentTime);
  const clockOption = useUIStore((state) => state.clock_options);
  const isDark = useSongStore((store) => store?.color?.isDark)

  if (clockOption === CLOCK_OPTIONS.DISABLED) return null;

  return (
    <div
      className={`absolute z-20 flex items-center ${
        clockPositionClasses[clockOption] || clockPositionClasses[CLOCK_OPTIONS.TOP_CENTER]
      }`}
      style={
        clockOption === CLOCK_OPTIONS.CUSTOM
          ? { top: 20, left: 20 }
          : undefined
      }
    >
      <p
        className={`font-semibold px-2 py-1 rounded transition-colors`}
        style={{
          color: isDark ? "#fff" : "#111",
          background: isDark
            ? "rgba(0,0,0,0.7)"
            : "rgba(255,255,255,0.7)",
          textShadow: isDark
            ? "0 1px 4px rgba(0,0,0,0.8)"
            : "0 1px 4px rgba(255,255,255,0.8)",
        }}
      >
        {currentTime}
      </p>
    </div>
  );
};