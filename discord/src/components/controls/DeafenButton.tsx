import { IconDeafenedDiscord, IconDeafenedOffDiscord } from "@src/assets/icons";
import { useCallStore } from "@src/stores/callStore";
import { useControlStore } from "@src/stores/controlStore";
import { ControlWrapper } from "./ControlWrapper";

export const DeafenButton = () => {
  const toggleDeafen = useControlStore((state) => state.toggleDeafen);
  const isDeafened = useCallStore((state) => state.callStatus?.user?.isDeafened ?? false);
  const isLoading = useCallStore((state) => state.isLoading && !state.callStatus);

  return (
    <ControlWrapper
      iconEnabled={<IconDeafenedOffDiscord className="w-full h-full text-white fill-white" />}
      iconDisabled={<IconDeafenedDiscord className="w-full h-full text-red-500 fill-red-500" />}
      onClick={toggleDeafen}
      isEnabled={!isDeafened}
      isLoading={isLoading}
    />
  );
};
