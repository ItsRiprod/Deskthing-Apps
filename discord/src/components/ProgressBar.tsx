import React, { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  oldProgress: number; // in ms
  totalLength: number; // in ms
  isPlaying: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  oldProgress,
  totalLength,
  isPlaying = false,
  className = "",
}) => {
  const [progress, setProgress] = useState(oldProgress);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(oldProgress);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (oldProgress < totalLength) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {

          if (!isPlaying) return prev; // Do not update if not playing

          if (prev + 1000 >= totalLength) {
            clearInterval(intervalRef.current!);
            return totalLength;
          }
          return prev + 1000;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [oldProgress, totalLength]);

  const percent = Math.min((progress / totalLength) * 100, 100);

  return (
    <div
      className={`bg-gray-500/50 rounded overflow-hidden ${className}`}
      style={{ position: "relative" }}
    >
      <div
        className="bg-emerald-800/75 h-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};