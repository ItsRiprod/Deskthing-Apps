import { IconDeafenedDiscord, IconDeafenedOffDiscord } from "@src/assets/icons"
import { useInitializeCallStore } from "@src/hooks/useInitializeCallStore"
import { useCallStore } from "@src/stores/callStore"
import { useControlStore } from "@src/stores/controlStore"
import { ControlWrapper } from "./ControlWrapper"

export const DeafenButton = () => {
  useInitializeCallStore()
  const toggleDeafen = useControlStore((state) => state.toggleDeafen)
  const { callStatus, isLoading } = useCallStore((state) => ({
    callStatus: state.callStatus,
    isLoading: state.isLoading,
  }))
  const isDeafened = callStatus?.user?.isDeafened || false
  const showLoading = isLoading && !callStatus

  return (
    <ControlWrapper
      iconEnabled={<IconDeafenedOffDiscord className="w-full h-full text-white fill-white" />}
      iconDisabled={<IconDeafenedDiscord className="w-full h-full text-red-500 fill-red-500" />}
      onClick={toggleDeafen}
      isEnabled={!isDeafened}
      isLoading={showLoading}
    />
  )
}