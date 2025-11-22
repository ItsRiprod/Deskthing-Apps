import { IconMicDiscord, IconMicOffDiscord } from "@src/assets/icons"
import { useInitializeCallStore } from "@src/hooks/useInitializeCallStore"
import { useCallStore } from "@src/stores/callStore"
import { useControlStore } from "@src/stores/controlStore"
import { ControlWrapper } from "./ControlWrapper"

export const MuteButton = () => {
  useInitializeCallStore()
  const toggleMute = useControlStore((state) => state.toggleMute)
  const { callStatus, isLoading } = useCallStore((state) => ({
    callStatus: state.callStatus,
    isLoading: state.isLoading,
  }))
  const isMuted = callStatus?.user?.isMuted || false
  const showLoading = isLoading && !callStatus

  return (
    <ControlWrapper
      iconEnabled={<IconMicDiscord className="w-full h-full text-white fill-white" />}
      iconDisabled={<IconMicOffDiscord className="w-full h-full text-red-500 fill-red-500" />}
      onClick={toggleMute}
      isEnabled={!isMuted}
      isLoading={showLoading}
    />
  )
}