import React from "react";
import useClientStore, { getCurrentClient } from "../clientStore";

const ScoreControls: React.FC = () => {
  const { incrementScore } = useClientStore();
  const currentClient = getCurrentClient();

  if (!currentClient) {
    return (
      <div className="text-gray-500 italic">
        Waiting for connection...
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Your Score</h3>
        <div className="text-3xl font-bold">{currentClient.score}</div>
      </div>
      
      <button
        onClick={incrementScore}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Increment Score
      </button>
      
      <p className="text-xs text-gray-400 mt-2 text-center">
        Click to increase your score by 1
      </p>
    </div>
  );
};

export default ScoreControls;
