import { useUIStore } from "@src/stores/uiStore";
import { PanelWrapper } from "./PanelWrapper";

export const ClockPanel = () => {
  const currentTime = useUIStore((state) => state.currentTime);

  return (
    <PanelWrapper>
      <div className="flex items-center justify-center w-full h-full">
        <p
          className="font-semibold px-6 py-4 rounded text-5xl transition-colors"
          style={{
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {currentTime}
        </p>
      </div>
    </PanelWrapper>
  );
};
