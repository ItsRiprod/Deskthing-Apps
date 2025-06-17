
import { FC } from "react";
import { ShipTypes } from "@shared/types/games/dual";

type SetupGameProps = {
  isOwner: boolean;
  width: number;
  height: number;
  shipType: ShipTypes | undefined;
  isReady: boolean;
  handleChangeX: (newVal: string) => void;
  handleChangeY: (newVal: string) => void;
  handleShipSelect: (shipType: ShipTypes) => void;
  handleConfirmation: () => void;
};

export const SetupGame: FC<SetupGameProps> = ({
  isOwner,
  width,
  height,
  shipType,
  isReady,
  handleChangeX,
  handleChangeY,
  handleShipSelect,
  handleConfirmation,
}) => {
  return (
    <div className="bg-black/80 z-10 absolute top-0 left-0 w-screen h-screen flex justify-center items-center">
      <div className="p-8 rounded-lg max-w-md w-full">
        <div className="space-y-6 text-white">
          <div>
            <label className="block mb-2">Select Your Ship</label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleShipSelect('basic')}
                className={`p-4 rounded-lg ${
                  shipType === 'basic' ? 'bg-blue-600' : 'bg-gray-700'
                } hover:bg-blue-700 transition-colors`}
              >
                Basic Ship
              </button>
              <button
                onClick={() => handleShipSelect('charged')}
                className={`p-4 rounded-lg ${
                  shipType === 'charged' ? 'bg-blue-600' : 'bg-gray-700'
                } hover:bg-blue-700 transition-colors`}
              >
                Charged Ship
              </button>
              <button
                onClick={() => handleShipSelect('reflected')}
                className={`p-4 rounded-lg ${
                  shipType === 'reflected' ? 'bg-blue-600' : 'bg-gray-700'
                } hover:bg-blue-700 transition-colors`}
              >
                Reflected Ship
              </button>
            </div>
          </div>

          {isOwner && (
            <>
              <div>
                <label className="block mb-2">Board Size</label>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="25"
                  value={width}
                  onChange={(e) => handleChangeX(e.target.value)}
                  className="w-full"
                />
                <div className="text-sm text-gray-400 mt-1">Width: {width}px</div>
              </div>
              <div>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="25"
                  value={height}
                  onChange={(e) => handleChangeY(e.target.value)}
                  className="w-full"
                />
                <div className="text-sm text-gray-400 mt-1">Height: {height}px</div>
              </div>
            </>
          )}

          <button
            onClick={handleConfirmation}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white w-full transition-colors"
          >
            {isReady ? "Waiting for other player..." : "Ready"}
          </button>
        </div>
      </div>
    </div>
  );
};
