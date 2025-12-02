import { ParticipantBox } from "@src/components/ParticipantBox";
import { useCallStore } from "@src/stores/callStore";
import { useRef, useEffect, useState } from "react";

export const MiniCallWidget = () => {
  const callStatus = useCallStore((state) => state.callStatus);

  const widgetRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [collapsed, setCollapsed] = useState(false);

  const [lastSpeakerId, setLastSpeakerId] = useState<string | null>(null);
  const participants = callStatus?.participants ?? [];

  useEffect(() => {
    if (!participants.length) return;

    const talkingSpeaker = participants.find((p) => p.isSpeaking);
    if (talkingSpeaker && talkingSpeaker.id !== lastSpeakerId) {
      setLastSpeakerId(talkingSpeaker.id);
    }
  }, [participants, lastSpeakerId]);

  const currentSpeaker =
    participants.find((p) => p.isSpeaking) ||
    (lastSpeakerId ? participants.find((p) => p.id === lastSpeakerId) || null : null);


  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current && e.button === 0) {
      setDragging(true);
      setOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // Touch drag handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (widgetRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      setDragging(true);
      setOffset({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPosition({
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        });
      }
    };
    const onMouseUp = () => setDragging(false);

    const onTouchMove = (e: TouchEvent) => {
      if (dragging && e.touches.length === 1) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - offset.x,
          y: touch.clientY - offset.y,
        });
      }
    };
    const onTouchEnd = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [dragging, offset]);

  if (!participants.length) return null;
  if (!currentSpeaker) return null;


  return (
    <div
      ref={widgetRef}
      style={{
        boxShadow: "0 6px 16px -4px rgba(0,0,0,0.7)",
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        width: collapsed ? 60 : 260,
        height: collapsed ? 40 : "auto",
        transition: "width 0.2s, height 0.2s",
        userSelect: dragging ? "none" : "auto",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none", // Prevent scrolling while dragging
      }}
      className={`mini-call-widget bg-[#23272a] rounded-lg`}
    >
      <div
        className="flex items-center justify-between px-2 py-1.5 cursor-grab bg-[#2c2f33] rounded-t-lg"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <span className="font-semibold text-white text-sm">
          {collapsed ? "" : callStatus?.channel?.name || 'Call'}
        </span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="bg-none border-none flex items-center justify-center text-white text-lg cursor-pointer w-6 h-6 rounded transition-colors duration-100"
          aria-label={collapsed ? "Expand" : "Collapse"}
          type="button"
        >
          {collapsed ? "▸" : "—"}
        </button>
      </div>
      {!collapsed && (
        <div className="p-2.5">
          <ParticipantBox participant={currentSpeaker} />
        </div>
      )}
    </div>
  );
};
