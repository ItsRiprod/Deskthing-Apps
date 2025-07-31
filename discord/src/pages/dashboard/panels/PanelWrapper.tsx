import { useUIStore } from "@src/stores/uiStore";

type PanelWrapperProps = {
  children: React.ReactNode;
};

export const PanelWrapper = ({ children }: PanelWrapperProps) => {
  const dimensions = useUIStore((state) => state.dimensions);

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
      <div className="w-full h-full overflow-y-auto relative flex justify-center rounded-3xl bg-neutral-900/95 border border-neutral-600 shadow-lg">
        {children}
      </div>
    </div>
  );
};
