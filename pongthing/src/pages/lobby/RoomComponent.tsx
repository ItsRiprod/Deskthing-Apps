import React from "react";
import { Room } from "@shared/types";

interface RoomComponentProps {
  room: Room;
  currentRoomId?: string;
  onJoinRoom: (roomId: string) => void;
}

const RoomComponent: React.FC<RoomComponentProps> = ({
  room,
  currentRoomId,
  onJoinRoom,
}) => {

  const isInRoom = currentRoomId === room.id;

  return (
    <div
      key={room.id}
      className="bg-gray-800 p-3 sm:p-4 rounded flex flex-col text-sm"
    >
      <div className="flex flex-wrap items-center mb-2">
        <div
          className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 rounded-md flex-shrink-0"
          style={{ backgroundColor: room.color }}
        />
        {room.status === "waiting" ? (
          <button
            onClick={() => onJoinRoom(room.id)}
            className="bg-blue-600 mr-2 sm:mr-3 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm"
          >
            {room.id == currentRoomId ? 'Open' : 'Join'}
          </button>
        ) : isInRoom && (
          <button
            onClick={() => onJoinRoom(room.id)}
            className="bg-green-600 mr-2 sm:mr-3 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm"
          >
            {'Rejoin Game'}
          </button>
        )}
        <div className="flex-grow min-w-[200px] mt-2 sm:mt-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ellipsis overflow-hidden">Room #{room.id}</span>
          </div>
          <div className="flex items-center mt-1">
            <span className={`px-2 py-0.5 text-xs sm:text-sm flex items-center justify-center rounded mr-2 ${
              room.status === "waiting"
                ? "bg-yellow-600"
                : room.status === "playing"
                ? "bg-green-600"
                : "bg-red-600"
            }`}>
              {room.status}
            </span>
            <span className="text-xs">{room.isFull ? "Full" : `${room.players.length}/${room.maxPlayers} Players`}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-2">
        <div className="flex flex-wrap gap-y-2 items-center justify-between">
          <div className="min-w-[140px]">
            <span className="text-xs text-gray-400">Game Mode:</span>
            <span className="text-sm ml-2">{room.game}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400">Owner:</span>
            <span className="text-sm ml-2">#{room.ownerId}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-gray-400">Players:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {room.players.map((player) => (
              <div key={player.id} className="flex items-center">
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1"
                  style={{ background: player.color }}
                />
                <span className="text-xs">
                  #{player.id}
                  {player.ready && " ✓"}
                  {player.wins && ` (W:${player.wins}${player.losses ? `/L:${player.losses}` : ""})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomComponent;