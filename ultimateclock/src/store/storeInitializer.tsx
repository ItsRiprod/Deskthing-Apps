import { useEffect } from "react"
import { useSettingStore } from "./settingsStore"
import { useMusicStore } from "./musicStore"
import { useBackgroundStore } from "./backgroundStore"

export const StoreInitializer = () => {
  const initSettings = useSettingStore((state) => state.init)
  const initSong = useMusicStore((state) => state.init)
  const initBackground = useBackgroundStore((state) => state.init)

  useEffect(() => {
    initSettings()
    initSong()
    initBackground()
  }, [initSettings, initSong, initBackground])

  return null
}