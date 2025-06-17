import React, { useEffect } from "react";
import { useLobbyStore } from "../../stores/lobbyStore";
import { usePlayerStore } from "@src/stores/playerStore";
import { GAME_OPTIONS } from "@shared/types/types";
import { useUIStore } from "@src/stores/uiStore";
import { useCallback, useState } from "react";
import debounce from "lodash/debounce";
import { useGameStore } from "@src/stores/gameStore";

const RoomScreen: React.FC = () => {
  const currentRoom = useLobbyStore((state) => state.currentRoom);
  const refreshCurrentRoom = useLobbyStore((state) => state.refreshCurrentRoom);
  const leaveRoom = useLobbyStore((state) => state.leaveRoom);
  const readyUp = useLobbyStore((state) => state.readyUp);
  const unready = useLobbyStore((state) => state.unready);
  const changeGame = useLobbyStore((state) => state.changeGame);
  const changeColor = useLobbyStore((state) => state.changeColor);
  const thisPlayer = usePlayerStore((state) => state.player);
  const setPage = useUIStore((state) => state.setCurrentPage);
  const gameState = useGameStore((state) => state.gameState);
  const startGame = useGameStore((state) => state.startGame);
  const [localColor, setLocalColor] = useState(currentRoom?.color || "#000000");

  const debouncedChangeColor = useCallback(
    debounce((color: string) => {
      changeColor(color);
    }, 500),
    []
  );

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    debouncedChangeColor(newColor);
  };

  useEffect(() => {
    if (currentRoom) {
      setLocalColor(currentRoom.color);
    }
  }, [currentRoom?.color]);

  if (!currentRoom) {
    return (
      <div className="bg-black text-white w-screen h-screen flex items-center justify-center flex-col">
        <p>Loading room...</p>
        <button
          onClick={refreshCurrentRoom}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Refresh Room
        </button>
      </div>
    );
  }

  if (!thisPlayer) {
    setPage("player");
    return;
  }

  const allPlayersReady =
    currentRoom.players.every((p) => p.ready) && currentRoom.isFull;
  const isOwner = currentRoom.ownerId === thisPlayer.id;

  const handleChangeGame = (game: GAME_OPTIONS) => {
    changeGame(game);
  };

  const handleOpenGame = () => {
    if (gameState) {
      setPage(gameState.game_type);
    }
  };

  const handleStartGame = () => {
    startGame();
    setPage(currentRoom.game);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setPage("lobby");
  };

  return (
    <div className="bg-black text-white min-h-screen w-full p-2 sm:p-4 md:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 auto-rows-min">
          {/* Players List */}
          <div
            className="border transition-colors duration-500 bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg overflow-y-auto max-h-[80vh] sm:max-h-[600px]"
            style={{
              borderColor: currentRoom?.color || "transparent",
            }}
          >
            <div className="flex justify-between items-center border-b mb-2 pb-1">
              <h1 className="text-lg sm:text-xl md:text-2xl truncate font-bold">
                Room {currentRoom.id.slice(0, 8)}
              </h1>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 sm:px-3 sm:py-2 rounded text-sm"
              >
                Leave
              </button>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3">
              Players ({currentRoom.players.length})
            </h2>
            <div className="space-y-2">
              {currentRoom.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-2 sm:p-3 rounded flex justify-between items-center ${
                    player.id === thisPlayer.id ? "bg-blue-700" : "bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium text-sm sm:text-base">
                      {`Player ${player.id.slice(-4)}`}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400">
                      (Wins: {player.wins || 0})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs ${
                        player.ready ? "bg-green-600" : "bg-yellow-600"
                      }`}
                    >
                      {player.ready ? "Ready" : "Not Ready"}
                    </span>
                    {player.id === thisPlayer.id && (
                      <span className="text-xs text-blue-400">(You)</span>
                    )}
                  </div>
                </div>
              ))}

              {!currentRoom.isFull && (
                <div className="p-2 sm:p-3 rounded bg-gray-600 text-gray-400 text-sm">
                  <span>Waiting for player...</span>
                </div>
              )}
            </div>
          </div>

          {/* Game Info & Controls */}
          <div
            className="bg-gray-800 transition-colors duration-500 border p-3 sm:p-4 md:p-6 rounded-lg  max-h-[80vh] sm:max-h-[600px]"
            style={{
              borderColor: currentRoom?.color || "transparent",
            }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4">
              Game Settings
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Room Status</p>
                <p
                  className={`font-semibold text-sm sm:text-base ${
                    currentRoom.status === "waiting"
                      ? "text-yellow-400"
                      : currentRoom.status === "playing"
                      ? "text-green-400"
                      : "text-blue-400"
                  }`}
                >
                  {currentRoom.status.charAt(0).toUpperCase() +
                    currentRoom.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Game Type</p>
                {isOwner && !allPlayersReady ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleChangeGame(GAME_OPTIONS.DUAL_MULTI)}
                      className={`bg-gray-700 text-white p-1.5 sm:p-2 rounded text-sm hover:bg-gray-600 ${
                        currentRoom.game === GAME_OPTIONS.DUAL_MULTI
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                    >
                      Dual
                    </button>
                    <button
                      onClick={() => handleChangeGame(GAME_OPTIONS.DUAL_SOLO)}
                      className={`bg-gray-700 text-white p-1.5 sm:p-2 rounded text-sm hover:bg-gray-600 ${
                        currentRoom.game === GAME_OPTIONS.DUAL_SOLO
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                    >
                      Solo Dual
                    </button>
                    <button
                      onClick={() => handleChangeGame(GAME_OPTIONS.PONG_MULTI)}
                      className={`bg-gray-700 text-white p-1.5 sm:p-2 rounded text-sm hover:bg-gray-600 ${
                        currentRoom.game === GAME_OPTIONS.PONG_MULTI
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                    >
                      Pong
                    </button>
                    <button
                      onClick={() => handleChangeGame(GAME_OPTIONS.PONG_SOLO)}
                      className={`bg-gray-700 text-white p-1.5 sm:p-2 rounded text-sm hover:bg-gray-600 ${
                        currentRoom.game === GAME_OPTIONS.PONG_SOLO
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                    >
                      Solo Pong
                    </button>
                  </div>
                ) : (
                  <p className="font-semibold text-white capitalize text-sm sm:text-base">
                    {currentRoom.game}
                  </p>
                )}
              </div>
              {isOwner && !allPlayersReady && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Room Color</p>
                  <input
                    type="color"
                    value={localColor}
                    onChange={handleColorChange}
                    className="w-full h-8 sm:h-10 rounded"
                  />
                </div>
              )}

              {allPlayersReady && (
                <div className="pt-2 sm:pt-4 text-center">
                  {currentRoom.status == "playing" ? (
                    <div>
                      <p className="text-green-400 font-semibold mb-2 text-sm sm:text-base">
                        Game Started!
                      </p>
                      <button
                        onClick={handleOpenGame}
                        className="w-full py-2 sm:py-3 px-4 rounded font-semibold bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                      >
                        Join Game
                      </button>
                    </div>
                  ) : allPlayersReady && isOwner ? (
                    <div>
                      <p className="text-green-400 font-semibold mb-2 text-sm sm:text-base">
                        Players Ready
                      </p>
                      <button
                        onClick={handleStartGame}
                        className="w-full py-2 sm:py-3 px-4 rounded font-semibold bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                      >
                        Start Game
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-green-400 font-semibold mb-2 text-sm sm:text-base">
                        {allPlayersReady
                          ? "All players ready! Game starting soon..."
                          : "Waiting for other players..."}
                      </p>
                      <div className="animate-pulse">
                        <div className="bg-green-600 h-2 rounded"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentRoom.status != "playing" && (
                <div className="pt-2 sm:pt-4">
                  {currentRoom.players.find((p) => p.id === thisPlayer.id)
                    ?.ready ? (
                    <button
                      onClick={unready}
                      className="w-full py-2 sm:py-3 px-4 rounded font-semibold bg-yellow-600 hover:bg-yellow-700 text-sm sm:text-base"
                    >
                      Cancel Ready
                    </button>
                  ) : (
                    <button
                      onClick={readyUp}
                      className="w-full py-2 sm:py-3 px-4 rounded font-semibold bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                    >
                      Ready Up
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomScreen;
