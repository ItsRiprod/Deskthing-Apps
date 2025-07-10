import { useCallStore } from "@src/stores/callStore"
import { useControlStore } from "@src/stores/controlStore"
import { ControlWrapper } from "./ControlWrapper"
import { IconMicDiscord, IconMicOffDiscord } from "@src/assets/icons"

export const MuteButton = () => {
  const toggleMute = useControlStore((state) => state.toggleMute)
  const isMuted = useCallStore((state) => state.callStatus?.user?.isMuted) || false

  return (
    <ControlWrapper
      iconEnabled={<IconMicDiscord className="w-full h-full text-white fill-white" />}
      iconDisabled={<IconMicOffDiscord className="w-full h-full text-red-500 fill-red-500" />}
      onClick={toggleMute}
      isEnabled={!isMuted}
    />
  )
}