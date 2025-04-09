import React, { useState, useEffect } from "react";
import { LinkClient } from "../../shared/models";
import useClientStore from "@src/clientStore";

interface ClientProps {
  client: LinkClient;
  isCurrentClient: boolean;
}

const Client: React.FC<ClientProps> = ({ client, isCurrentClient }) => {
  const incrementScore = useClientStore((state) => state.incrementScore);
  const [displayScore, setDisplayScore] = useState(client.score);

  const handleIncrementScore = () => {
    incrementScore();
  }

  useEffect(() => {
    if (client.score === displayScore) return;

    const difference = client.score - displayScore;
    const isIncreasing = difference > 0;
    const absDifference = Math.abs(difference);

    const interval = Math.max(
      5,
      Math.min(1000, 100 / Math.ceil(absDifference / 8))
        
    );

    const timer = setTimeout(() => {
      setDisplayScore((prev) => (isIncreasing ? prev + 1 : prev - 1));
    }, interval);

    return () => clearTimeout(timer);
  }, [client.score, displayScore]);

  return (
    <div
      className={`
          rounded-lg p-4 transition-all duration-300 border-2
          ${
            isCurrentClient
              ? "border-purple-500 bg-zinc-800"
              : "border-zinc-800 bg-zinc-900"
          }
        `}
      style={{ borderLeftColor: client.color, borderLeftWidth: "6px" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: client.color }}
          ></div>
          <h3
            className={`font-semibold ${
              isCurrentClient ? "cursor-pointer hover:text-purple-400" : ""
            }`}
          >
            {isCurrentClient
              ? "You"
              : `Client ${client.id.substring(0, 6) || "Pending..."}`}
          </h3>
          {isCurrentClient && (
            <button
              onClick={handleIncrementScore}
              className="ml-2 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors"
            >
              +1
            </button>
          )}
        </div>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
          {client.id.substring(0, 8) || "Pending..."}
        </span>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <div className="text-sm text-gray-400">Score</div>
        <div className="text-2xl font-bold">{displayScore}</div>
      </div>
    </div>
  );
};

export default Client;
