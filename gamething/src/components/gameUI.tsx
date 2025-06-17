
import React from 'react';

interface GameUIProps {
  playerScore: number;
  aiScore: number;
  gameRunning: boolean;
  onStartGame: () => void;
  onStopGame: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  playerScore,
  aiScore,
  gameRunning,
  onStartGame,
  onStopGame
}) => {
  return (
    <>
      <div className="text-white mb-4">
        <h1 className="text-4xl font-bold text-center mb-2">PONG</h1>
        <div className="text-2xl text-center">
          Player: {playerScore} | AI: {aiScore}
        </div>
      </div>

      <div className="mt-4 space-x-4">
        <button 
          onClick={onStartGame}
          disabled={gameRunning}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-600"
        >
          Start Game
        </button>
        <button 
          onClick={onStopGame}
          disabled={!gameRunning}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-600"
        >
          Stop Game
        </button>
      </div>
    </>
  );
};
