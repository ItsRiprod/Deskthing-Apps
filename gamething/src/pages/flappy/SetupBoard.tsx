
import { FC } from "react";

type SetupBoardProps = {
  isOwner: boolean;
  width: number;
  height: number;
  difficulty: number;
  handleChangeX: (newVal: string) => void;
  handleChangeY: (newVal: string) => void;
  handleChangeDifficulty: (newVal: string) => void;
  handleConfirmation: () => void;
};

export const SetupBoard: FC<SetupBoardProps> = ({
  isOwner,
  width,
  height,
  difficulty,
  handleChangeX,
  handleChangeY,
  handleChangeDifficulty,
  handleConfirmation,
}) => {
  return (
    <div className="bg-black/80 z-10 absolute top-0 left-0 w-screen h-screen flex justify-center items-center">
      {isOwner ? (
        <div className="p-8 rounded-lg max-w-md w-full">
          <div className="space-y-6 text-white">
            <div>
              <label className="block mb-2">Game Area Size</label>
              <input
                type="range"
                min="300"
                max="800"
                step="20"
                value={width}
                onChange={(e) => handleChangeX(e.target.value)}
                className="w-full"
              />
              <div className="text-sm text-gray-400 mt-1">Width: {width}px</div>
            </div>
            <div>
              <input
                type="range"
                min="300"
                max="800"
                step="20"
                value={height}
                onChange={(e) => handleChangeY(e.target.value)}
                className="w-full"
              />
              <div className="text-sm text-gray-400 mt-1">Height: {height}px</div>
            </div>
            <div>
              <label className="block mb-2">Game Speed</label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => handleChangeDifficulty(e.target.value)}
                className="w-full"
              />
              <div className="text-sm text-gray-400 mt-1">
                Difficulty: {difficulty}
              </div>
            </div>
            <button
              onClick={handleConfirmation}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white w-full transition-colors"
            >
              Start Flappy Bird
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-black p-6 rounded-lg text-white text-center">
          <div className="mb-4">Waiting for room owner to start the game...</div>
          <div className="animate-pulse">⌛</div>
        </div>
      )}
    </div>
  );
};
