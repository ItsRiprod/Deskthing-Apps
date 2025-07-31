import { SONG_CONTROLS } from "@shared/types/discord";
import React, { useRef, useState } from "react";

interface SongControlsWrapperProps {
  position: SONG_CONTROLS;
  children: React.ReactNode;
}

export const SongControlsWrapper: React.FC<SongControlsWrapperProps> = ({
  position,
  children,
}) => {
  // For FREE mode: allow dragging
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragging = useRef(false);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (position !== SONG_CONTROLS.FREE) return;
    dragging.current = true;
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging.current) return;
    setDragPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  if (position === SONG_CONTROLS.DISABLED) return null;

  if (position === SONG_CONTROLS.FREE) {
    return (
      <div
        style={{
          position: "fixed",
          left: dragPos.x,
          top: dragPos.y,
          zIndex: 50,
          touchAction: "none",
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={
      [
        "absolute left-1/2 -translate-x-1/2 z-40",
        position === SONG_CONTROLS.TOP ? "top-2" : "",
        position === SONG_CONTROLS.BOTTOM ? "bottom-2" : ""
      ].filter(Boolean).join(" ")
      }
    >
      {children}
    </div>
  );
};

export { SONG_CONTROLS };