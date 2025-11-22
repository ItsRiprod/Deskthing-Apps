import React from "react";

interface ControlWrapperProps {
  iconEnabled: React.ReactNode;
  iconDisabled: React.ReactNode;
  onClick: () => void;
  isEnabled: boolean;
  isLoading?: boolean;
}

export const ControlWrapper: React.FC<ControlWrapperProps> = ({
  iconEnabled,
  iconDisabled,
  onClick,
  isEnabled,
  isLoading = false,
}) => {
  const LoadingSpinner = () => (
    <svg
      className="w-6 h-6 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );

  return (
    <button
      onClick={onClick}
      type="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`flex items-center justify-center w-full h-full rounded-2xl transition-colors focus:outline-none focus-visible:ring-0 ${
        isEnabled ? "bg-transparent" : "bg-red-500/50"
      } ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      disabled={isLoading}
    >
      {isLoading ? <LoadingSpinner /> : isEnabled ? iconEnabled : iconDisabled}
    </button>
  );
};
