import { useUIStore } from "@src/stores/uiStore";

type PanelWrapperProps = {
  children: React.ReactNode;
  scrollable?: boolean;
};

export const PanelWrapper = ({ children, scrollable = true }: PanelWrapperProps) => {
  const dimensions = useUIStore((state) => state.dimensions);
  const overflowClass = scrollable ? "overflow-y-auto" : "overflow-hidden";

  return (
    <div
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        width: "100%",
        height: "100%",
        maxHeight: dimensions.panel.height,
      }}
      className="flex justify-center p-2 min-w-0 min-h-0"
    >
      <div
        className={`w-full h-full min-w-0 min-h-0 ${overflowClass} relative flex justify-center rounded-3xl bg-neutral-900/95 border border-neutral-600 shadow-lg`}
      >
        {children}
      </div>
    </div>
  );
};
