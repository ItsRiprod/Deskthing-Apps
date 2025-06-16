import { FC, useState } from "react";
import { usePlayerStore } from "@src/stores/playerStore";
import { useUIStore } from "@src/stores/uiStore";

export const PlayerSetup: FC = () => {
  const player = usePlayerStore((state) => state.player);
  const createPlayer = usePlayerStore((state) => state.createPlayer);
  const updatePlayer = usePlayerStore((state) => state.updatePlayer);
  const setPage = useUIStore((state) => state.setCurrentPage);
  const [selectedColor, setSelectedColor] = useState(
    player?.color || "#FF6B6B"
  );

  const defaultColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
  ];

  const handleContinue = () => {
    updatePlayer({ color: selectedColor });
    setPage("lobby");
  };

  const handleCreatePlayer = () => {
    createPlayer();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="w-screen">
        {player ? (
          <div className="flex flex-wrap items-center justify-center">
            <div className="w-full md:w-1/2 p-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-4">
                Choose Your Color
              </h1>
              <p className="text-gray-400 text-center text-sm sm:text-base mb-6">
                Pick a color that represents you in the game
              </p>

              <div className="flex justify-center mb-6">
                <input
                  type="color"
                  className="w-32 h-32 sm:w-40 sm:h-40 cursor-pointer rounded-2xl border-4 border-purple-500 bg-gray-800 -webkit-appearance-none"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                />
              </div>

              <div className="flex justify-center flex-wrap mb-6">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 hover:border-white m-2"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2 p-4 flex flex-col justify-center items-center">
              <div className="mb-6 flex flex-col justify-center items-center">
                <p className="text-gray-400 text-sm text-center mb-2">
                  Your selected color:
                </p>
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-purple-500 shadow-lg"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>

              <button
                onClick={handleContinue}
                className="px-6 py-2 sm:px-8 sm:py-3 bg-purple-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Continue to Lobby
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-screen flex-wrap items-center justify-center">
            <button
              onClick={handleCreatePlayer}
              className="px-6 py-2 sm:px-8 sm:py-3 bg-purple-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Create Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
