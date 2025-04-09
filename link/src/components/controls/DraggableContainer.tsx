import React, { useState, useEffect } from "react";

interface DraggableContainerProps {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  style?: React.CSSProperties;
  className?: string;
}

const DraggableContainer: React.FC<DraggableContainerProps> = ({
  children,
  initialPosition = {
    x: window.innerWidth - 150,
    y: window.innerHeight - 150,
  },
  style = {},
  className = "",
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Dragging handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsDragging(true);
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (isDragging) {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      setPosition({
        x: clientX - dragOffset.x,
        y: clientY - dragOffset.y,
      });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  return (
    <div
      className={`fixed ${className}`}
      style={{ 
        left: position.x + "px", 
        top: position.y + "px",
        ...style
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {children}
    </div>
  );
};

export default DraggableContainer;
