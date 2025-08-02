import { DeskThing } from "@deskthing/client";
import { IconPause, IconPlay, IconRewind, IconSkip } from "@src/assets/icons";
import { ProgressBar } from "@src/components/ProgressBar";
import { useSongStore } from "@src/stores/songStore";
import { useMemo } from "react";
import { PanelWrapper } from "./PanelWrapper";
import { useUIStore } from "@src/stores/uiStore";
import {
  SONG_CONTROLS,
  SongControlsWrapper,
} from "@src/components/song/SongControlsWrapper";

export const SongPanel = () => {
  const songData = useSongStore((state) => state.songData);
  const skip = useSongStore((state) => state.skip);
  const togglePlay = useSongStore((state) => state.playPause);
  const rewind = useSongStore((state) => state.rewind);
  const controlPos = useUIStore((state) => state.song_controls);

  const thumbnail = useMemo(() => {
    if (!songData?.thumbnail) return null;
    return DeskThing.useProxy(songData?.thumbnail);
  }, [songData?.thumbnail]);

  const { progress, totalLength } = useMemo(() => {
    if (!songData) return { progress: 0, totalLength: 0 };
    const progress = songData.track_progress || 0;
    const totalLength = songData.track_duration || 5000;
    return { progress, totalLength };
  }, [songData?.id]);

  return (
    <PanelWrapper>
      <div
        style={{
          backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
          backgroundPosition: "center",
        }}
        className="relative w-full h-full flex items-end bg-cover justify-center"
      >
        <SongControlsWrapper position={controlPos}>
          <div className="text-white font-semibold flex space-x-2 max-w-[90%] w-11/12 overflow-x-hidden whitespace-nowrap flex-nowrap items-center justify-center min-w-0">
            <p className="text-ellipsis min-w-0">{songData?.track_name}</p>
            <p>{"-"}</p>
            <p className="text-ellipsis min-w-0">{songData?.artist}</p>
          </div>
          <div
            style={{
              boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)"
            }}
            className="rounded-2xl w-11/12 p-2 flex items-center justify-center"
          >
            <button onClick={rewind} className="w-12 px-2 h-12">
              <IconRewind className={`stroke-2 ${songData?.color?.isDark ? 'text-white fill-white' : 'text-black fill-black'}`} />
            </button>
            <button onClick={togglePlay} className="w-12 px-2 h-12">
              {songData?.is_playing ? (
                <IconPause className={`stroke-2 ${songData?.color?.isDark ? 'text-white fill-white' : 'text-black fill-black'}`} />
              ) : (
                <IconPlay className={`stroke-2 ${songData?.color?.isDark ? 'text-white fill-white' : 'text-black fill-black'}`} />
              )}
            </button>
            <button onClick={skip} className="w-12 px-2 h-12">
              <IconSkip className={`stroke-2 ${songData?.color?.isDark ? 'text-white fill-white' : 'text-black fill-black'}`} />
            </button>
          </div>
        </SongControlsWrapper>
          <ProgressBar
            className="w-full h-2"
            oldProgress={progress}
            totalLength={totalLength}
            isPlaying={songData?.is_playing || false}
          />
      </div>
    </PanelWrapper>
  );
};
