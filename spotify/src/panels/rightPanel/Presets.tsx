import { PresetComponent } from "@src/components/PresetComponent";
import { usePlaylists } from "../../hooks/usePlaylists";

export const Presets = () => {
  const { presets } = usePlaylists();
  return (
    <div>
      {presets.map((preset) => (
        <PresetComponent preset={preset} />
      ))}
    </div>
  );
};
