import { IconCallDiscord } from "@src/assets/icons";
import { useCallStore } from "@src/stores/callStore";
import { useControlStore } from "@src/stores/controlStore";
import { ControlWrapper } from "./ControlWrapper";

export const EndCallButton = () => {
  const endCall = useControlStore((state) => state.disconnect);
  const isInCall = useCallStore((state) => state.callStatus?.isConnected ?? false);
  const isLoading = useCallStore((state) => state.isLoading && !state.callStatus);

  return (
    <ControlWrapper
      iconEnabled={<IconCallDiscord className="w-full h-full text-white fill-white" />}
      iconDisabled={<IconCallDiscord className="w-full h-full text-red-500 fill-red-500" />}
      onClick={() => {
        if (isInCall) endCall();
      }}
      isEnabled={!isInCall}
      isLoading={isLoading}
    />
  );
};
