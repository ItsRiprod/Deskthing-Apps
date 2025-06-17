import React, { useEffect, useRef, useState, useCallback } from "react";
import { createDeskThing } from "@deskthing/client";
import { useGameStore } from "@src/stores/gameStore";
import { useLobbyStore } from "@src/stores/lobbyStore";
import { usePlayerStore } from "@src/stores/playerStore";
import { AdvanceLasers, GetBorderLasers, MarkLasersAsSent } from "./dualLogic";
import {
  DualLaser,
  FromClientToServer,
  FromServerToClient,
  GAME_CLIENT,
  GAME_OPTIONS,
  GameState,
  Room,
  ShipTypes,
  DualShip,
} from "@shared/types";
import { useUIStore } from "@src/stores/uiStore";
import { SetupGame } from "./SetupGame";
import { SHIP_INITIAL_STATS } from "./constants";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>();

type AssertedDualGameState = Extract<
  GameState,
  { game_type: GAME_OPTIONS.DUAL_MULTI }
>;

const DualMultiGameScreen: React.FC = () => {
  const serverGameState = useGameStore((state) => state.gameState);
  const setServerGameState = useGameStore((state) => state.setGameState);
  const subscribeToEvents = useGameStore((state) => state.subscribeToGameUpdates);
  const currentRoom = useLobbyStore((state) => state.currentRoom);
  const leaveRoom = useLobbyStore((state) => state.leaveRoom);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const player = usePlayerStore((state) => state.player);

  const [gameState, setGameState] = useState<AssertedDualGameState>({
    game_type: GAME_OPTIONS.DUAL_MULTI,
    state: {
      lasers: [],
      players: {},
      sizeX: 300,
      sizeY: 300,
      isSetup: false,
      roomId: "",
    },
    scores: {},
    room: serverGameState?.room || (currentRoom as Room),
    isCompleted: false,
  });

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const pendingLasersRef = useRef<DualLaser[]>([]);
  const ship = gameState.state.players[player?.id || ''] as DualShip | undefined

  // Ship position state
  const [shipPosition, setShipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    DeskThing.overrideKeys(["wheel"]);
    return () => {
      DeskThing.restoreKeys(["wheel"]);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((data) => {
      if (data.request == 'update') {
        if (data.payload.game_type !== GAME_OPTIONS.DUAL_MULTI) return;
        
        switch (data.payload.action_type) {
          case 'laser_add': {
            const newLasers = data.payload.action
            pendingLasersRef.current = [...pendingLasersRef.current, ...newLasers]
            break;
          }
        }

      }
    });
    return () => {
      unsubscribe();
    };
  }, [subscribeToEvents]);

  // Touch movement handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (!gameRef.current || e.touches.length === 0 || !player) return;

      const rect = gameRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const shipSize = ship?.sizeX || 20;

      // Constrain movement within arena bounds
      const constrainedX = Math.max(
        0,
        Math.min(gameState.state.sizeX - shipSize, x - shipSize / 2)
      );
      const constrainedY = Math.max(
        0,
        Math.min(gameState.state.sizeY - shipSize, y - shipSize / 2)
      );

      setShipPosition({ x: constrainedX, y: constrainedY });

      // Update game state
      setGameState((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          players: {
            ...prev.state.players,
            [player.id]: {
              ...prev.state.players[player.id],
              x: constrainedX,
              y: constrainedY,
            },
          },
        },
      }));
    },
    [gameState.state.sizeX, gameState.state.sizeY, player]
  );

  // Mouse movement handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gameRef.current || !player) return;

      const rect = gameRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ship size
      const shipSize = ship?.sizeX || 20;

      // Constrain movement within arena bounds
      const constrainedX = Math.max(
        0,
        Math.min(gameState.state.sizeX - shipSize, x - shipSize / 2)
      );
      const constrainedY = Math.max(
        0,
        Math.min(gameState.state.sizeY - shipSize, y - shipSize / 2)
      );
      

      setShipPosition({ x: constrainedX, y: constrainedY });

      // Update game state
      setGameState((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          players: {
            ...prev.state.players,
            [player.id]: {
              ...prev.state.players[player.id],
              x: constrainedX,
              y: constrainedY,
            },
          },
        },
      }));
    },
    [gameState.state.sizeX, gameState.state.sizeY, player]
  );

  // Wheel movement handler (left/right movement)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (!player) return;

      const shipSpeed = 10;
      const shipSize = ship?.sizeX || 20;

      // Use both deltaX and deltaY for movement
      const deltaX =
        e.deltaX !== 0 ? (e.deltaX > 0 ? shipSpeed : -shipSpeed) : 0;
      const deltaY =
        e.deltaY !== 0 ? (e.deltaY > 0 ? shipSpeed : -shipSpeed) : 0;

      setShipPosition((prev) => {
        const newX = Math.max(
          0,
          Math.min(gameState.state.sizeX - shipSize, prev.x + deltaX)
        );
        const newY = Math.max(
          0,
          Math.min(gameState.state.sizeY - shipSize, prev.y + deltaY)
        );

        // Update game state
        setGameState((prevState) => ({
          ...prevState,
          state: {
            ...prevState.state,
            players: {
              ...prevState.state.players,
              [player.id]: {
                ...prevState.state.players[player.id],
                x: newX,
                y: newY,
              },
            },
          },
        }));

        return { x: newX, y: newY };
      });
    },
    [gameState.state.sizeX, gameState.state.sizeY, player]
  );

  // Shooting handler
  const handleShoot = useCallback(() => {
    if (!player || !gameState.state.isSetup || gameState.isCompleted) return;

    const currentPlayer = ship;
    if (!currentPlayer || currentPlayer.hp <= 0) return;

    // Create a new laser
    const newLaser: DualLaser = {
      id: `${player.id}-${Date.now()}`,
      x: shipPosition.x + 10, // Center of ship
      y: shipPosition.y,
      VelX: 0,
      VelY: -1, // Shoot upward
      origin: player.id,
      damage: 10,
      side: player.id,
      type: "basic",
    };

    console.log("Handling shoot", newLaser);

    // Add laser to game state
    pendingLasersRef.current.push(newLaser);
  }, [player, gameState.state.isSetup, gameState.isCompleted, shipPosition]);

  // Keyboard handler for shooting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') {
        handleShoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShoot]);

  // Set up event listeners
  useEffect(() => {
    const gameElement = gameRef.current;
    if (gameElement && gameState.state.isSetup && !gameState.isCompleted) {
      // Mouse events
      gameElement.addEventListener("mousemove", handleMouseMove);

      // Touch events
      gameElement.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      gameElement.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });

      // Wheel events
      document.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });

      return () => {
        gameElement.removeEventListener("mousemove", handleMouseMove);
        gameElement.removeEventListener("touchstart", handleTouchStart);
        gameElement.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("wheel", handleWheel, { capture: true });
      };
    }
  }, [
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleWheel,
    gameState.state.isSetup,
  ]);

  // Game loop - handles laser movement and collision detection
  const updateGame = useCallback(
    (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      if (deltaTime < 16) {
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      if (
        !gameState ||
        !currentRoom ||
        gameState.isCompleted ||
        gameState.game_type !== GAME_OPTIONS.DUAL_MULTI ||
        !gameState.state.isSetup ||
        !player
      ) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      // Update laser positions
      let updatedState = { ...gameState.state };

      if (pendingLasersRef.current.length > 0) {
        updatedState.lasers = [
          ...updatedState.lasers,
          ...pendingLasersRef.current,
        ];
        console.log(
          "Added pending lasers, total count:",
          updatedState.lasers.length
        );
        pendingLasersRef.current = []; // Clear pending lasers
      }

      updatedState = AdvanceLasers(player.id, updatedState, deltaTime);

      const borderLasers = GetBorderLasers(player.id, updatedState);

      // Send payload only if there is a laser past the edge
      if (borderLasers.length > 0) {
        // Send game state update to server

        updatedState = MarkLasersAsSent(player.id, updatedState, borderLasers.map((l) => l.id));

        DeskThing.send({
          type: GAME_CLIENT.GAME_UPDATE,
          request: "update",
          payload: {
            game_type: GAME_OPTIONS.DUAL_MULTI,
            action_type: "laser_add",
            action: borderLasers,
            gameId: currentRoom.id,
          },
        });
      }

      if (updatedState.players[player.id].hp <= 0) {
        setGameState((prev) => ({
          ...prev,
          isCompleted: true,
        }));
        // Send the fact that the player is dead
        DeskThing.send({
          type: GAME_CLIENT.GAME_UPDATE,
          request: "update",
          payload: {
            game_type: GAME_OPTIONS.DUAL_MULTI,
            action_type: "state_update",
            action: updatedState,
            gameId: currentRoom.id,
          },
        });
      }

      // Update the state locally
      setGameState((prev) => ({
        ...prev,
        state: updatedState,
      }));

      lastTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(updateGame);
    },
    [gameState, player, currentRoom]
  );

  useEffect(() => {
    if (gameState && !gameState.isCompleted) {
      animationFrameRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState?.isCompleted, updateGame]);


  useEffect(() => {
    if (serverGameState?.game_type == GAME_OPTIONS.DUAL_MULTI) {
      setGameState(serverGameState);
    }
  }, [serverGameState]);

  const opponentPlayer = currentRoom?.players.find((p) => p.id != player?.id);

  const handleReturnToLobby = () => {
    setCurrentPage("lobby");
    setServerGameState(null);
    leaveRoom();
  };

  const handleConfirmSetup = () => {
    console.log("Confirming setup", gameState);
    DeskThing.send({
      type: GAME_CLIENT.GAME_UPDATE,
      request: "update",
      payload: {
        game_type: GAME_OPTIONS.DUAL_MULTI,
        action_type: "state_update",
        action: gameState.state,
        gameId: currentRoom?.id || "",
      },
    });
  };

  const handleSelectShip = () => {
    console.log("Confirming ship")

    if (!player || !currentRoom || !ship) return

    DeskThing.send({
      type: GAME_CLIENT.GAME_UPDATE,
      request: "update",
      payload: {
          game_type: GAME_OPTIONS.DUAL_MULTI,
          action_type: 'set_player',
          action: ship,
          gameId: currentRoom.id,
        }
    })
  }

  const handleChangeX = (newVal: string) => {
    setGameState((prev) => ({
      ...prev,
      state: { ...prev.state, sizeX: parseInt(newVal) },
    }));
  };

  const handleChangeY = (newVal: string) => {
    setGameState((prev) => ({
      ...prev,
      state: { ...prev.state, sizeY: parseInt(newVal) },
    }));
  };

  const handleShipSelect = (type: ShipTypes) => {
    const ship = SHIP_INITIAL_STATS[type];

    setGameState((prev) => {
      if (!player) return prev;

      if (!prev.state.players[player.id]) {
        return prev;
      }
      return {
        ...prev,
        state: {
          ...prev.state,
          players: {
            ...prev.state.players,
            [player.id]: {
              ...prev.state.players[player.id],
              ...ship,
              x: shipPosition.x,
              y: shipPosition.y,
            },
          },
        },
      };
    });
  };

  const handleConfirmation = () => {
    if (isOwner) {
      handleConfirmSetup();
    } else {
      handleSelectShip()
    }
  };
    const isOwner = currentRoom?.ownerId == player?.id;
    const currentPlayer = gameState.state.players[player?.id || ""];
    const renderableLasers = gameState.state.lasers.filter(
      (laser) => laser.side == player?.id
    );
    const MAX_AMMO = 30; // Constant for max ammo
    const CURRENT_AMMO = 25; // Example current ammo

    return (
      <div className="bg-gradient-to-b from-gray-900 to-black w-screen h-screen flex flex-col justify-center items-center">
        {!gameState.state.isSetup && (
          <SetupGame
            isOwner={isOwner}
            width={gameState.state.sizeX}
            height={gameState.state.sizeY}
            shipType={gameState.state.players[player?.id || ""]?.shipType}
            isReady={gameState.state.isSetup}
            handleChangeX={handleChangeX}
            handleChangeY={handleChangeY}
            handleShipSelect={handleShipSelect}
            handleConfirmation={handleConfirmation}
          />
        )}
        <div
          ref={gameRef}
          className="relative border-4 border-indigo-500 rounded-lg shadow-lg select-none"
          style={{
            width: `${gameState.state.sizeX}px`,
            height: `${gameState.state.sizeY}px`,
            backgroundColor: "rgba(0,0,0,0.8)",
            backgroundImage: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 80%)",
          }}
          onClick={handleShoot}
        >
          {renderableLasers.map((laser) => (
            <div
              key={laser.id}
              className="absolute"
              style={{
                left: `${laser.x}px`,
                top: `${laser.y}px`,
                width: "16px",
                height: "8px",
                transform: `rotate(${Math.atan2(laser.VelY, laser.VelX) * (180 / Math.PI)}deg)`,
              }}
            >
              <div className={`w-full h-full rounded-full ${
                currentPlayer?.shipType === "basic" ? "bg-blue-500" :
                currentPlayer?.shipType === "charged" ? "bg-yellow-500" :
                "bg-emerald-500"
              }`} />
            </div>
          ))}
          {currentPlayer && (
            <div
              className="absolute"
              style={{
                left: `${currentPlayer.x}px`,
                top: `${currentPlayer.y}px`,
                width: `${currentPlayer.sizeX}px`,
                height: `${currentPlayer.sizeY}px`,
              }}
            >
              <div className="relative">
                <svg
                  width={currentPlayer.sizeX}
                  height={currentPlayer.sizeY}
                  viewBox="0 0 50 30"
                >
                  <path
                    d="M25 2 L45 28 L5 28 Z"
                    className={`${
                      currentPlayer.shipType === "basic" ? "fill-blue-500 stroke-blue-300" :
                      currentPlayer.shipType === "charged" ? "fill-yellow-500 stroke-yellow-300" :
                      "fill-emerald-500 stroke-emerald-300"
                    }`}
                    strokeWidth="2"
                  />
                  <path
                    d="M25 5 L35 25 L15 25 Z"
                    className={`${
                      currentPlayer.shipType === "basic" ? "fill-blue-300" :
                      currentPlayer.shipType === "charged" ? "fill-yellow-300" :
                      "fill-emerald-300"
                    } opacity-50`}
                  />
                </svg>
                
                <div className="absolute -bottom-8 left-1/2 w-full" style={{transform: 'translateX(-50%)'}}>
                  <div className="h-2 w-full bg-gray-800 rounded-full mb-1">
                    <div
                      className={`h-full rounded-full ${
                        currentPlayer.hp > 70 ? "bg-green-500" :
                        currentPlayer.hp > 30 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${currentPlayer.hp}%` }}
                    />
                  </div>
                  
                  <div className="h-2 w-full bg-gray-800 rounded-full">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${(CURRENT_AMMO / MAX_AMMO) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {gameState.isCompleted && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center gap-4 rounded-lg">
              <div className="text-white text-4xl font-bold mb-2">Game Over!</div>
              <div className="text-white text-2xl mb-6 font-semibold">
                {gameState.scores[player?.id || ""] > gameState.scores[opponentPlayer?.id || ""]
                  ? "Victory! 🏆"
                  : "Defeated! 🎮"}
              </div>
              <div className="text-white text-xl mb-8">
                Final Score: 
                <span className="text-blue-400 mx-2">{gameState.scores[player?.id || ""]}</span>
                -
                <span className="text-red-400 mx-2">{gameState.scores[opponentPlayer?.id || ""]}</span>
              </div>
              <button
                onClick={handleReturnToLobby}
                className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-lg font-bold text-white text-lg"
              >
                Return to Lobby
              </button>
            </div>
          )}
        </div>
      </div>
  );
};

export default DualMultiGameScreen;