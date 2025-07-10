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
    <button onClick={onClick} className={`items-center h-full p-1 rounded-xl transition-colors cursor-pointer ${isEnabled ? "bg-transparent" : "bg-red-500/50"}`}>
      {isEnabled ? iconEnabled : iconDisabled}
    </button>
  );
};
