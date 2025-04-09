import React, { useState } from "react";
import useClientStore, { getCurrentClient } from "../clientStore";
import DraggableContainer from "./controls/DraggableContainer";
import ConnectButton from "./controls/ConnectButton";
import ControlPanel from "./controls/ControlPanel";

const UnifiedControls: React.FC = () => {
  const initialized = useClientStore((state) => state.initialized);  
  const currentClient = getCurrentClient();
    const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  if (!initialized || !currentClient) {
    return (
      <DraggableContainer className="bg-zinc-900 p-4 rounded-lg shadow-lg flex flex-col items-center border border-zinc-800">
        <ConnectButton />
      </DraggableContainer>
    );
  }

  return (
    <DraggableContainer
      className="shadow-lg transition-[background,border,width,height,borderRadius,padding] duration-300"      
      style={{ 
        backgroundColor: currentClient?.color || "#9333EA",
        borderRadius: isExpanded ? "1rem" : "50%",
        padding: isExpanded ? "1rem" : "0",
        width: isExpanded ? "auto" : "4rem",
        height: isExpanded ? "auto" : "4rem",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)"
      }}
    >
      {isExpanded ? (
        <ControlPanel
          onClose={toggleExpanded}
          client={currentClient}
        />
      ) : (
        <button
          className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
          onClick={toggleExpanded}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </DraggableContainer>
  );
};

export default UnifiedControls;