import React from "react";
import { DISPLAY_ITEMS } from "@shared/recordTypes";
import { ClockComponent } from "./components/ClockComponent";
import { PlaybackComponent } from "./components/PlaybackComponent";
import {
  recordXAlignMap,
  recordYAlignMap,
  sizeClassMap,
  textAlignMap,
} from "./constants/settingMaps";
import { useSettingStore } from "./stores/settingsStore";
import { useMusicStore } from "./stores/musicStore";

const App: React.FC = () => {
  const settings = useSettingStore((state) => state.settings);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const songData = useMusicStore((state) => state.songData);
  const color = useMusicStore((state) => state.color);

  return (
    settings && (
      <div
        className="flex-col w-screen h-screen flex justify-center items-center p-8"
        style={{
          background: `${color?.rgba || "rgb(0, 0, 0)"}`,
        }}
      >
        {settings?.display?.value?.includes(DISPLAY_ITEMS.BG_THUMBNAIL) && (
          <div
            className="absolute w-screen h-screen"
            style={{
              backgroundImage: `url(${songData?.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: `blur(${settings?.bgBlur?.value || 10}px) ${
                settings?.display.value.includes(DISPLAY_ITEMS.BG_DARKENED)
                  ? "brightness(0.5)"
                  : ""
              }`,
            }}
          />
        )}
        <div
          className={`
					fixed 
					${recordXAlignMap[settings?.recordSize?.value || "small"][settings?.recordPosX?.value || "left"]} 
					${recordYAlignMap[settings?.recordSize?.value || "small"][settings?.recordPosY?.value || "top"]} 
					left-[-100vh] 
					rounded-full 
					${sizeClassMap[settings?.recordSize?.value]} 
					${isPlaying ? "animate-spin-slow" : ""}
				`}
        >
          <div
            style={{ backgroundImage: `url(./vinyl.svg)` }}
            className="absolute border-black w-full h-full bg-cover bg-center bg-no-repeat "
          />
          <div
            style={{
              backgroundImage: `url(${
                settings?.display?.value?.includes(DISPLAY_ITEMS.RECORD_THUMBNAIL)
                  ? songData?.thumbnail
                  : ""
              })`,
              filter: settings?.display?.value?.includes(
                DISPLAY_ITEMS.BG_DARKENED
              )
                ? "brightness(0.5)"
                : "",
            }}
            className="absolute rounded-full border-black border-2 w-[65%] h-[65%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cover bg-center bg-no-repeat"
          />
        </div>
        {settings?.display?.value?.includes(DISPLAY_ITEMS.CLOCK) && (
          <div className="absolute top-2 w-full flex justify-center">
            <ClockComponent />
          </div>
        )}
        <div
          className={`w-full h-full flex flex-col justify-center ${
            textAlignMap[settings?.textPos?.value]
          } relative`}
        >
          {settings?.display?.value?.includes(DISPLAY_ITEMS.ALBUM) && (
            <p
              className={`text-xl text-left ${
                color?.isLight ? "text-black" : "text-white"
              } font-light`}
            >
              {songData?.album || "Nothing"}
            </p>
          )}
          {settings?.display?.value?.includes(DISPLAY_ITEMS.TITLE) && (
            <p
              className={`text-4xl text-left ${
                color?.isLight ? "text-black" : "text-white"
              } font-bold`}
            >
              {songData?.track_name || "Nothing"}
            </p>
          )}
          {settings?.display?.value?.includes(DISPLAY_ITEMS.ARTISTS) && (
            <p
              className={`text-3xl text-left ${
                color?.isLight ? "text-black" : "text-white"
              } font-normal`}
            >
              {songData?.artist || "Nothing"}
            </p>
          )}
        </div>
        {settings?.display?.value?.includes(DISPLAY_ITEMS.CONTROLS) && (
          <div className="absolute bottom-2 w-full flex justify-center">
            <PlaybackComponent />
          </div>
        )}
      </div>
    )
  );
};

export default App;
