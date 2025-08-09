import { useSettingStore } from "@src/store/settingsStore";
import { ClockSettingIDs } from "@shared/index";
import { ClockWrapper } from "./ClockWrapper";
import { useMusicStore } from "@src/store/musicStore";

export const Clock = () => {
  const time = useSettingStore((state) => state.currentTime);
  const settings = useSettingStore((state) => state.settings);
  const color = useMusicStore((state) => state.textColor) || "#ffffff";

  // Get relevant settings
  const transparency = settings?.[ClockSettingIDs.CLOCK_OPACITY] ?? 1;
  const shadowEnabled = settings?.[ClockSettingIDs.CLOCK_SHADOW] ?? false;
  const shadowDistance = settings?.[ClockSettingIDs.CLOCK_SHADOW_DISTANCE] ?? 0;
  const shadowOpacity = settings?.[ClockSettingIDs.CLOCK_SHADOW_OPACITY] ?? 0;
  const shadowBlur = settings?.[ClockSettingIDs.CLOCK_SHADOW_BLUR] ?? 0;
  const justify = settings?.[ClockSettingIDs.CLOCK_JUSTIFY_CONTENT] || "center";
  const gradientEnabled =
    settings?.[ClockSettingIDs.COLOR_OPTIONS].includes("gradient") || false;
  const gradientStart = settings?.[ClockSettingIDs.GRADIENT_START] || "#ff0000";
  const gradientEnd = settings?.[ClockSettingIDs.GRADIENT_END] || "#0000ff";
  const fontSize = settings?.[ClockSettingIDs.CLOCK_SIZE] || 180;

  // Positioning settings
  const x = settings?.[ClockSettingIDs.CLOCK_POS_X] ?? 0; // px
  const y = settings?.[ClockSettingIDs.CLOCK_POS_Y] ?? 0; // px

  // Gradient text style
  const baseStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    opacity: transparency,
    transform: `translate(${x}px, ${y}px)`,
    justifyContent: justify,
  };

  const shadowStyle: React.CSSProperties = {
    ...baseStyle,
    color: shadowEnabled ? `rgba(0,0,0, ${shadowOpacity})` : "transparent",
    transform: `translate(${x + shadowDistance}px, ${y + shadowDistance}px)`,
    filter: shadowEnabled ? `blur(${shadowBlur}px)` : "none",
    position: "absolute" as const,
    zIndex: 1,
  };

  const textStyle: React.CSSProperties = gradientEnabled
    ? {
        ...baseStyle,
        background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        position: "relative" as const,
        zIndex: 2,
      }
    : {
        ...baseStyle,
        color,
        textShadow: shadowEnabled
          ? `${shadowDistance}px ${shadowDistance}px ${shadowBlur}px rgba(0,0,0, ${shadowOpacity})`
          : "none",
      };

  return (
    <ClockWrapper>
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Shadow element - only rendered for gradients */}
        {gradientEnabled && shadowEnabled && (
          <p
            className="min-h-fit min-w-fit text-nowrap font-clock"
            style={shadowStyle}
          >
            {time}
          </p>
        )}

        {/* Main text element */}
        <p
          className="min-h-fit min-w-fit text-nowrap font-clock"
          style={textStyle}
        >
          {time}
        </p>
      </div>
    </ClockWrapper>
  );
};
