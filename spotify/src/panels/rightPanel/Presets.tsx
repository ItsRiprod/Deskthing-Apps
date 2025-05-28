import { PresetComponent } from "@src/components/PresetComponent";
import { usePlaylists } from "../../hooks/usePlaylists";
import Button from "@src/components/Button"
import { RefreshCw } from "lucide-react"

export const Presets = () => {
  const { presets, fetchPresets } = usePlaylists();
 
  const handleRefreshPlaylist = () => {
    fetchPresets();
  }

  return (
    <div className="h-full flex flex-col max-h-full w-full p-4 pt-0">
      <div className="overflow-y-scroll w-full h-full mb-4 rounded-xl">
        {presets.map((preset, index) => (
          <div key={index} className="max-w-full w-full overflow-y-hidden mb-1">
            <PresetComponent preset={preset} />
          </div>
        ))}
      </div>
      <div className="flex justify-start">
        <Button
          onClick={handleRefreshPlaylist}
          className="p-2 rounded-xl text-neutral-300 items-center bg-neutral-900"
        >
          <p className="mr-2">Refresh</p>
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
};
