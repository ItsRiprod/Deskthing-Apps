import React from "react";

interface ControlWrapperProps {
  iconEnabled: React.ReactNode;
  iconDisabled: React.ReactNode;
  onClick: () => void;
  isEnabled: boolean;
}

export const ControlWrapper: React.FC<ControlWrapperProps> = ({
  iconEnabled,
  iconDisabled,
  onClick,
  isEnabled,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-full h-full rounded-2xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-0 ${
        isEnabled ? "bg-transparent" : "bg-red-500/50"
      }`}
    >
      {isEnabled ? iconEnabled : iconDisabled}
    </button>
  );
};
