import React from "react";
import { useLobbyStore } from "@src/stores/lobbyStore";
import { useUIStore } from "@src/stores/uiStore";
import { GAME_OPTIONS } from "@shared/types/types";
import { usePlayerStore } from "@src/stores/playerStore";
import RoomComponent from "./RoomComponent";

const LobbyScreen: React.FC = () => {
  const lobby = useLobbyStore((state) => state.lobby);
  const currentRoom = useLobbyStore((state) => state.currentRoom);
  const leaveRoom = useLobbyStore((state) => state.leaveRoom);
  const currentPlayer = usePlayerStore((state) => state.player);
  const createRoom = useLobbyStore((state) => state.createRoom);
  const joinRoom = useLobbyStore((state) => state.joinRoom);
  const refreshLobby = useLobbyStore((state) => state.refreshLobby);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);

  const handleCreateRoom = () => {
    if (!currentPlayer) {
      setCurrentPage("player");
      return;
    }
    createRoom(currentPlayer.color, GAME_OPTIONS.PONG_MULTI);
    setCurrentPage("room");
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
    setCurrentPage("room");
  };

  const handleEditCharacter = () => {
    setCurrentPage("player");
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  return (
    <div className="bg-black text-white w-screen h-screen p-2 sm:p-4 overflow-y-auto">
      <div className="h-full flex flex-col md:flex-row gap-2 sm:gap-4">
        {/* Player Section */}
        <div className="md:w-1/3">
          <div className="bg-gray-800 flex flex-col p-2 sm:p-4 min-h-fit rounded h-full">
            <div className="flex-shrink-0">
              <h2 className="text-lg sm:text-xl mb-2 sm:mb-4">
                Player Profile
              </h2>
              <div className="mb-2 sm:mb-4 flex items-center">
                <div
                  className="w-4 sm:w-8 h-4 sm:h-8 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: currentPlayer?.color || "#FFFFFF",
                  }}
                />
                <div className="ml-2 w-10/12">
                  <span className="text-xs sm:text-sm truncate block">
                    {currentPlayer?.id}
                  </span>
                  <div className="flex w-full justify-between">
                    <p className="text-xs text-neutral-500 sm:text-sm mb-1 sm:mb-2">
                      Wins: {currentPlayer?.wins || 0}
                    </p>
                    <p className="text-xs text-neutral-500 sm:text-sm mb-1 sm:mb-2">
                      Losses: {currentPlayer?.losses || 0}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEditCharacter}
                className="bg-purple-600 hover:bg-purple-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm w-full"
              >
                Edit Information
              </button>
            </div>
            {/* Other Players */}
            <div className="mt-2 sm:mt-4 min-h-24 flex-grow overflow-y-auto bg-gray-900 p-2 sm:p-4 rounded">
              <h2 className="text-lg sm:text-xl mb-2 sm:mb-4">Other Players</h2>
              {lobby?.players && lobby.players.length > 0 ? (
                <div className="space-y-1 sm:space-y-2">
                  {lobby.players
                    .filter((player) => player.id !== currentPlayer?.id)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 transition-colors duration-500 sm:w-4 h-3 sm:h-4 rounded-full mr-1 sm:mr-2"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-xs sm:text-sm">
                            {player.id.substring(0, 20)}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 sm:text-sm">
                          {player.wins || 0}W/{player.losses || 0}L
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-400">
                  No other players online
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lobby Section */}
        <div className="lg:w-2/3 flex flex-col">
          <div className="mb-2">
            <button
              onClick={handleCreateRoom}
              className="bg-green-600 hover:bg-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm"
            >
              New Room
            </button>
            <button
              onClick={refreshLobby}
              className="bg-blue-600 ml-2 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm"
            >
              Refresh Lobby
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!lobby?.rooms || lobby.rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-4">
                <p className="text-gray-400 text-xs sm:text-sm">
                  No rooms available
                </p>
              </div>
            ) : (
              <div className="grid gap-1 sm:gap-2">
                {lobby.rooms.map((room) => (
                  <RoomComponent
                    key={room.id}
                    room={room}
                    inRoom={room.playerIds.includes(currentPlayer?.id || "")}
                    onJoinRoom={handleJoinRoom}
                    onLeaveRoom={handleLeaveRoom}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
