import { ClockSettingIDs } from "@shared/index";
import { useBackgroundStore } from "@src/store/backgroundStore";
import { useMusicStore } from "@src/store/musicStore";
import { useSettingStore } from "@src/store/settingsStore";

export const BackgroundComponent = () => {
  const backgroundUrl = useBackgroundStore((state) => state.backgroundUrl);
  const thumbnailUrl = useMusicStore((state) => state.thumbnailUrl);
  const backgroundColor = useSettingStore((state) => state.settings?.[ClockSettingIDs.BACKGROUND_COLOR] || "#000000");
  const mode = useSettingStore((state) => state.settings?.[ClockSettingIDs.BACKGROUND] || "color");
  const blur = useSettingStore((state) => state.settings?.[ClockSettingIDs.BACKGROUND_BLUR] || 0);

  let style: React.CSSProperties = {};

  if (mode === "color") {
    style = {
      backgroundColor: backgroundColor,
    };
  } else if (mode === "picture") {
    style = {
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: `blur(${blur}px)`,
      WebkitFilter: `blur(${blur}px)`, // For Safari compatibility
    };
  } else if (mode === "thumbnail") {
    style = {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: `blur(${blur}px)`,
      WebkitFilter: `blur(${blur}px)`, // For Safari compatibility
    };
  }

  return (
    <div
      className="w-screen h-screen absolute top-0 left-0 z-0"
      style={style}
    />
  );
};
