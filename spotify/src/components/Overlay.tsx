
import React from 'react';

interface OverlayProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ children, onClose }) => {

  return (
    <div 
      className="absolute w-full h-screen top-0 right-0 bg-black/20 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default Overlay;
