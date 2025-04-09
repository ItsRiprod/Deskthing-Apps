import React from "react";
import ColorPicker from "./ColorPicker";
import { LinkClient } from "@shared/models";
import useClientStore from "@src/clientStore";

interface ControlPanelProps {
  onClose: (e: React.MouseEvent) => void;
  client: LinkClient;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onClose, client }) => {
  const incrementScore = useClientStore((state) => state.incrementScore);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold">Controls</h3>
        <button
          className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>{" "}
      </div>
      <ColorPicker client={client} />
      <button
        className="w-full py-2 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-colors"
        onClick={incrementScore}
      >
        Increment Score (+1)
      </button>

      <div className="text-white text-center font-medium">
        Score: {client.score || 0}
      </div>
    </div>
  );
};

export default ControlPanel;
