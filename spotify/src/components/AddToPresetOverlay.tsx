import { FC } from "react";
import { Playlist } from "@shared/spotifyTypes";
import { PresetComponent } from "./PresetComponent";
import { usePlaylists } from "@src/hooks/usePlaylists";
import Overlay from "./Overlay";

type AddToPresetOverlayProps = {
  onPresetSelect: (index: number) => void;
  onClose: () => void;
};

export const AddToPresetOverlay: FC<AddToPresetOverlayProps> = ({
  onPresetSelect,
  onClose,
}) => {
  const { presets } = usePlaylists();

  return (
    <Overlay onClose={onClose}>
      <div className="w-full h-full flex flex-col p-4 bg-neutral-950 rounded-xl overflow-y-auto">
        <h2 className="text-2xl text-neutral-200 font-semibold mb-4">
          Add to Preset
        </h2>
        <div className="flex flex-col">
          {presets.map((preset: Playlist) => (
            <button
              key={preset.index}
              onClick={() => {
                onPresetSelect(preset.index - 1); // the index is off by one
                onClose();
              }}
            >
              <div className="rounded-lg bg-neutral-900 w-full flex-nowrap flex items-center mb-2">
                {preset.thumbnail_url && (
                  <img
                    src={preset.thumbnail_url}
                    alt={preset.title}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex w-full flex-col overflow-x-hidden h-full justify-center p-3">
                  <div className="overflow-clip w-full">
                    <h1 className="text-left text-xl text-neutral-200 text-ellipsis text-nowrap overflow-hidden font-semibold">
                      {preset.title}
                    </h1>
                    <p className="text-left text-neutral-500 text-ellipsis text-nowrap overflow-hidden font-medium">
                      {preset.owner}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
};
