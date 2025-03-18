import { useCallback, useMemo, useRef, useState } from "react";

type SwipeContainerTypes = {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  swipeLeftIcon?: React.ReactNode;
  swipeRightIcon?: React.ReactNode;
  leftTriggerColor?: string;
  rightTriggerColor?: string;
};

export const SwipeContainer = ({
  children,
  className,
  leftTriggerColor = "bg-red-500",
  rightTriggerColor = "bg-green-500",
  onSwipeLeft,
  onTap,
  onSwipeRight,
  swipeLeftIcon,
  swipeRightIcon,
}: SwipeContainerTypes) => {
  const [offset, setOffset] = useState(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 100;

  // Use requestAnimationFrame for smoother updates
  const updateOffset = useCallback((newOffset: number) => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${newOffset}px)`;
    }
    setOffset(newOffset);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - startXRef.current;
      updateOffset(diff);
    },
    [updateOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = e.clientX;
      const diff = currentX - startXRef.current;
      updateOffset(diff);
    },
    [updateOffset]
  );

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;

    if (offset > threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (offset < -threshold && onSwipeRight) {
      onSwipeRight();
    } else if (Math.abs(offset) < 10 && onTap) {
      // Detect tap when there's minimal movement
      onTap();
    }

    // Animate back to center
    if (containerRef.current) {
      containerRef.current.style.transition = "transform 0.3s ease";
      containerRef.current.style.transform = "translateX(0)";
      // Reset transition after animation completes
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = "";
        }
      }, 300);
    }

    setOffset(0);
    isDraggingRef.current = false;
  }, [offset, onSwipeLeft, onSwipeRight, onTap, threshold]);

  const memoChildren = useMemo(() => children, [children]);

  return (
    <div
      className={`relative transition-colors flex overflow-hidden ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full flex items-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        <div
          style={{
            width: offset + 8,
            transform: `translateX(${-offset}px)`,
            opacity: Math.min(offset * 0.01, 1),
          }}
          className={`flex absolute left-0 h-full items-center justify-center ${leftTriggerColor}`}
        >
          {swipeLeftIcon && <div>{swipeLeftIcon}</div>}
        </div>
        <div className="w-full flex items-center z-10 justify-center">
          {memoChildren}
        </div>
        <div
          style={{
            width: offset * -1 + 8,
            transform: `translateX(${offset * -1}px)`,
            opacity: Math.min(offset * -0.01, 1),
          }}
          className={`flex absolute h-full right-0 items-center justify-center ${rightTriggerColor}`}
        >
          {swipeRightIcon && <div>{swipeRightIcon}</div>}
        </div>
      </div>
    </div>
  );
};
