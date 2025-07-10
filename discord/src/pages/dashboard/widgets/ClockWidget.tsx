import { useUIStore } from "@src/stores/uiStore";

export const ClockWidget = () => {
  const currentTime = useUIStore((state) => state.currentTime);

  return (
    <div className="absolute top-0 w-full flex items-center justify-center">
      <p className="text-white font-semibold">
        {currentTime}
      </p>
      </div>
  )
}