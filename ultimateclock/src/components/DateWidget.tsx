import { useSettingStore } from "@src/store/settingsStore";
import React from "react";

interface DateWidgetProps {
  shadowStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
  containerStyle: React.CSSProperties;
  shadowEnabled: boolean;
  gradientEnabled: boolean;
}

export const DateWidget: React.FC<DateWidgetProps> = ({
  shadowStyle,
  textStyle,
  containerStyle,
  shadowEnabled,
  gradientEnabled,
}) => {
  const currentDate = useSettingStore((state) => state.currentDate);

  return (
    <div style={containerStyle}>
      {gradientEnabled && shadowEnabled && (
        <p
          className="min-h-fit min-w-fit text-nowrap font-date"
          style={shadowStyle}
        >
          {currentDate}
        </p>
      )}

      <p
        className="min-h-fit min-w-fit text-nowrap font-date"
        style={textStyle}
      >
        {currentDate}
      </p>
    </div>
  );
};
