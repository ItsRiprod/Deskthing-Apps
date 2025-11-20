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
        maxWidth: dimensions.panel.width,
        maxHeight: dimensions.panel.height,
        width: dimensions.panel.width,
        height: dimensions.panel.height,
      }}
      className="flex justify-center p-2"
    >
      <div
        className={`w-full h-full ${overflowClass} relative flex justify-center rounded-3xl bg-neutral-900/95 border border-neutral-600 shadow-lg`}
      >
        {children}
      </div>
    </div>
  );
};
