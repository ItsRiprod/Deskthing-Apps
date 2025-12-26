import { useSettingStore } from "@src/store/settingsStore";
import { ClockSettingIDs, ClockWidgets } from "@shared/index";
import { ClockWrapper } from "./ClockWrapper";
import { useMusicStore } from "@src/store/musicStore";
import { DateWidget } from "./DateWidget";
import React, { useMemo } from "react";

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
    settings?.[ClockSettingIDs.COLOR_OPTIONS]?.includes("gradient") || false;
  const gradientStart = settings?.[ClockSettingIDs.GRADIENT_START] || "#ff0000";
  const gradientEnd = settings?.[ClockSettingIDs.GRADIENT_END] || "#0000ff";
  const fontSize = settings?.[ClockSettingIDs.CLOCK_SIZE] || 180;
  const dateFontSize = Math.round(fontSize * 0.3);
  const fontFamily = "'CustomClockFont', 'GeistVF', sans-serif";

  // Widget settings
  const enabledWidgets = settings?.[ClockSettingIDs.WIDGETS] || [];
  const widgetOrdering = settings?.[ClockSettingIDs.CLOCK_ORDERING] || ['clock', ClockWidgets.DATE];

  // Positioning settings
  const x = settings?.[ClockSettingIDs.CLOCK_POS_X] ?? 0; // px
  const y = settings?.[ClockSettingIDs.CLOCK_POS_Y] ?? 0; // px
  const dateX = settings?.[ClockSettingIDs.DATE_POS_X] ?? 0;
  const dateY = settings?.[ClockSettingIDs.DATE_POS_Y] ?? 0;

  // Gradient text style
  const baseStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    opacity: transparency,
    transform: `translate(${x}px, ${y}px)`,
    justifyContent: justify,
    fontFamily,
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
        fontFamily,
        position: "relative" as const,
        zIndex: 2,
      }
    : {
        ...baseStyle,
        color,
        fontFamily,
        textShadow: shadowEnabled
          ? `${shadowDistance}px ${shadowDistance}px ${shadowBlur}px rgba(0,0,0, ${shadowOpacity})`
          : "none",
      };

  const dateBaseStyle: React.CSSProperties = {
    opacity: transparency,
    transform: `translate(${dateX}px, ${dateY}px)`,
  };

  const dateShadowStyle: React.CSSProperties = {
    ...dateBaseStyle,
    fontSize: `${dateFontSize}px`,
    fontFamily,
    color: shadowEnabled ? `rgba(0,0,0, ${shadowOpacity})` : "transparent",
    transform: `translate(${dateX + shadowDistance}px, ${dateY + shadowDistance}px)`,
    filter: shadowEnabled ? `blur(${shadowBlur}px)` : "none",
    position: "absolute" as const,
    zIndex: 1,
  };

  const dateTextStyle: React.CSSProperties = gradientEnabled
    ? {
        ...dateBaseStyle,
        fontSize: `${dateFontSize}px`,
        background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        fontFamily,
        position: "relative" as const,
        zIndex: 2,
      }
    : {
        ...dateBaseStyle,
        fontSize: `${dateFontSize}px`,
        color,
        fontFamily,
        textShadow: shadowEnabled
          ? `${shadowDistance}px ${shadowDistance}px ${shadowBlur}px rgba(0,0,0, ${shadowOpacity})`
          : "none",
      };

  const renderClock = () => (
    <div key="clock" style={{ position: "relative", display: "inline-block" }}>
      {gradientEnabled && shadowEnabled && (
        <p
          className="min-h-fit min-w-fit text-nowrap font-clock"
          style={shadowStyle}
        >
          {time}
        </p>
      )}

      <p
        className="min-h-fit min-w-fit text-nowrap font-clock"
        style={textStyle}
      >
        {time}
      </p>
    </div>
  );

  const renderDate = () => {
    if (!enabledWidgets.includes(ClockWidgets.DATE)) return null;
    const containerStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
    };
    return (
      <DateWidget
        key="date"
        shadowStyle={dateShadowStyle}
        textStyle={dateTextStyle}
        containerStyle={containerStyle}
        shadowEnabled={shadowEnabled}
        gradientEnabled={gradientEnabled}
      />
    );
  };

  const renderWidgets = useMemo(() => {
    return widgetOrdering.map((widget) => {
      switch (widget) {
        case 'clock':
          return renderClock();
        case ClockWidgets.DATE:
          return renderDate();
        // Other widgets like stopwatch/countdown can be added here later
        default:
          return null;
      }
    });
  }, [widgetOrdering, enabledWidgets, time, textStyle, shadowStyle, gradientEnabled, shadowEnabled]);

  return (
    <ClockWrapper>
      <div className="flex flex-col items-center">
        {renderWidgets}
      </div>
    </ClockWrapper>
  );
};
