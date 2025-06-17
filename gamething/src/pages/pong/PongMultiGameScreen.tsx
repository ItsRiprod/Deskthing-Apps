import React, { useEffect, useRef, useState, useCallback } from "react";
import { createDeskThing } from "@deskthing/client";
import { useGameStore } from "@src/stores/gameStore";
import { useLobbyStore } from "@src/stores/lobbyStore";
import { usePlayerStore } from "@src/stores/playerStore";
import {
  updateBallPosition,
  checkWallCollision,
  checkPaddleCollision,
  checkYScoring,
  GAME_CONFIG,
  PaddleState,
} from "./pongLogic";
import {
  BallUpdatePayload,
  FromClientToServer,
  FromServerToClient,
  GAME_CLIENT,
  GAME_OPTIONS,
  GameState,
  Room,
} from "@shared/types";
import { useUIStore } from "@src/stores/uiStore";
import { SetupBoard } from "./SetupBoard";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

type AssertedPongGameState = Extract<
  GameState,
  { game_type: GAME_OPTIONS.PONG_MULTI }
>;

const PongMultiGameScreen: React.FC = () => {
  const serverGameState = useGameStore((state) => state.gameState);
  const setServerGameState = useGameStore((state) => state.setGameState);
  const currentRoom = useLobbyStore((state) => state.currentRoom);
  const leaveRoom = useLobbyStore((state) => state.leaveRoom);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const player = usePlayerStore((state) => state.player);

  const [gameState, setGameState] = useState<AssertedPongGameState>({
    game_type: GAME_OPTIONS.PONG_MULTI,
    state: {
      ballPosition: { x: 400, y: 150 },
      ballVelocity: { x: -3, y: 2 },
      gameWidthPx: 750,
      gameHeightPx: 300,
      turn: "player",
      difficulty: 1,
      bounces: 0,
      isSetup: false,
      roomId: serverGameState?.room.id || currentRoom?.id || "",
    },
    scores: {
      player: 0,
      ai: 0,
    },
    room: serverGameState?.room || (currentRoom as Room),
    isCompleted: false,
  });

  useEffect(() => {
    DeskThing.overrideKeys(["wheel"]);
    return () => {
      DeskThing.restoreKeys(["wheel"]);
    };
  }, []);

  useEffect(() => {
    if (serverGameState?.game_type == GAME_OPTIONS.PONG_MULTI) {
      setGameState(serverGameState);
    }
  }, [serverGameState]);

  const gameRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const myPaddleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const [myPaddleX, setMyPaddleX] = useState(
    gameState.state.gameWidthPx / 2 - GAME_CONFIG.PADDLE_X / 2
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gameRef.current) return;
      const rect = gameRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const paddleX = Math.max(
        0,
        Math.min(
          gameState.state.gameWidthPx - GAME_CONFIG.PADDLE_X,
          x - GAME_CONFIG.PADDLE_X / 2
        )
      );
      setMyPaddleX(paddleX);
    },
    [gameState.state.gameWidthPx]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (!gameRef.current || e.touches.length === 0) return;
      const rect = gameRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const paddleX = Math.max(
        0,
        Math.min(
          gameState.state.gameWidthPx - GAME_CONFIG.PADDLE_X,
          x - GAME_CONFIG.PADDLE_X / 2
        )
      );
      setMyPaddleX(paddleX);
    },
    [gameState.state.gameWidthPx]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const paddleSpeed = 20;
      const paddleChange =
        (e.deltaY == 0 ? 0 : e.deltaY > 0 ? paddleSpeed : -paddleSpeed) +
        (e.deltaX == 0 ? 0 : e.deltaX > 0 ? paddleSpeed : -paddleSpeed);
      const newX = myPaddleX + paddleChange;
      const paddleX = Math.max(
        0,
        Math.min(gameState.state.gameWidthPx - GAME_CONFIG.PADDLE_X, newX)
      );
      setMyPaddleX(paddleX);
    },
    [myPaddleX, gameState.state.gameWidthPx]
  );

  const opponentPlayer = currentRoom?.players.find((p) => p.id != player?.id);

  // Game loop - only runs when it's my turn and ball is in my half
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
        gameState.game_type !== GAME_OPTIONS.PONG_MULTI ||
        !gameState.state.isSetup ||
        !player ||
        gameState.state.turn !== player.id // Only run when it's my turn
      ) {
        lastTimeRef.current = currentTime;

        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const myPaddle: PaddleState = { x: myPaddleX };

      // Update ball position with difficulty scaling
      let newBall = updateBallPosition(
        gameState.state,
        (deltaTime / 16) *
          Math.max(gameState.state.difficulty, 1) *
          (1 + Math.log(Math.max(gameState.state.bounces, 1)) * 0.4)
      );

      // Check collisions
      newBall = checkPaddleCollision(newBall, myPaddle, undefined, true); // true = Multi game
      newBall = checkWallCollision(newBall, true); // true = Multi game

      // Check scoring
      const scorer = checkYScoring(newBall);
      let scored = false;
      let scoringPlayerId = "";

      if (scorer) {
        scored = true;
        if (scorer === "bottom") {
          // Ball went past my paddle - opponent scores
          scoringPlayerId = opponentPlayer?.id || "";
          const ballUpdate: BallUpdatePayload = {
            ballPosition: {
              x: newBall.gameWidthPx / 2,
              y: newBall.gameHeightPx / 2,
            },
            ballVelocity: { x: 5, y: (Math.random() - 0.5) * 7 },
            scored,
            roomId: currentRoom.id,
            scoringPlayerID: scoringPlayerId,
          };

          newBall.turn = opponentPlayer?.id || "";

          setGameState((prev) => ({
            ...prev,
            state: newBall,
          }));

          DeskThing.send({
            type: GAME_CLIENT.GAME_UPDATE,
            request: "update",
            payload: {
              game_type: GAME_OPTIONS.PONG_MULTI,
              action_type: "ball_update",
              action: ballUpdate,
            },
          });
        } else if (scorer === "switch") {
          // Ball hit the top boundary - switch to opponent's turn
          // Send ball update to switch control
          const ballUpdate: BallUpdatePayload = {
            ballPosition: newBall.ballPosition,

            ballVelocity: {
              x: newBall.ballVelocity.x,
              y: newBall.ballVelocity.y,
            },
            scored: false,
            roomId: currentRoom.id,
            scoringPlayerID: "",
          };

          newBall.turn = opponentPlayer?.id || "";

          setGameState((prev) => ({
            ...prev,
            state: newBall,
          }));

          DeskThing.send({
            type: GAME_CLIENT.GAME_UPDATE,
            request: "update",
            payload: {
              game_type: GAME_OPTIONS.PONG_MULTI,
              action_type: "ball_update",
              action: ballUpdate,
            },
          });

          lastTimeRef.current = currentTime;
          animationFrameRef.current = requestAnimationFrame(updateGame);
          return;
        }
      }

      // Update local game state immediately for smooth gameplay
      setGameState((prev) => ({
        ...prev,
        state: newBall,
      }));

      lastTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(updateGame);
    },
    [gameState, myPaddleX, player, opponentPlayer, currentRoom?.id]
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
    const gameElement = gameRef.current;
    if (gameElement) {
      gameElement.addEventListener("mousemove", handleMouseMove);
      gameElement.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });

      return () => {
        gameElement.removeEventListener("mousemove", handleMouseMove);
        gameElement.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("wheel", handleWheel, { capture: true });
      };
    }
  }, [handleMouseMove, handleTouchMove, handleWheel]);

  if (gameState?.game_type != GAME_OPTIONS.PONG_MULTI) {
    return (
      <div className="bg-black w-screen h-screen flex flex-col justify-center items-center">
        <div className="text-white text-3xl">
          Game type {gameState?.game_type} is not expected!
        </div>
      </div>
    );
  }

  const handleReturnToLobby = () => {
    setCurrentPage("lobby");
    setServerGameState(null);
    leaveRoom();
  };

  const handleChangeX = (val: string) => {
    setGameState((prev) => ({
      ...prev,
      state: { ...prev.state, gameWidthPx: parseInt(val) },
    }));
  };

  const handleChangeY = (val: string) => {
    setGameState((prev) => ({
      ...prev,
      state: { ...prev.state, gameHeightPx: parseInt(val) },
    }));
  };

  const handleChangeDifficulty = (val: string) => {
    setGameState((prev) => ({
      ...prev,
      state: { ...prev.state, difficulty: parseInt(val) },
    }));
  };

  const handleConfirmSetup = () => {
    console.log("Confirming setup", gameState);
    DeskThing.send({
      type: GAME_CLIENT.GAME_UPDATE,
      request: "update",
      payload: {
        game_type: GAME_OPTIONS.PONG_MULTI,
        action_type: "state_update",
        action: gameState.state,
      },
    });
  };

  const isOwner = currentRoom?.ownerId == player?.id;

  return (
    <div className="bg-black w-screen h-screen flex flex-col justify-center items-center">
      {!gameState.state.isSetup && (
        <SetupBoard
          isOwner={isOwner}
          width={gameState.state.gameWidthPx}
          height={gameState.state.gameHeightPx}
          difficulty={gameState.state.difficulty}
          handleChangeX={handleChangeX}
          handleChangeY={handleChangeY}
          handleChangeDifficulty={handleChangeDifficulty}
          handleConfirmation={handleConfirmSetup}
        />
      )}
      <div
        ref={gameRef}
        className="relative border-2 border-white border-t-0 select-none"
        style={{
          width: `${gameState.state.gameWidthPx}px`,
          height: `${gameState.state.gameHeightPx}px`,
          backgroundColor: "#000000",
        }}
      >
        {/* Left Score (Player) */}
        <div
          className="absolute text-center flex items-center justify-center"
          style={{
            left: "25%",
            top: gameState.state.gameHeightPx / 2 + "px",
            transform: "translateX(-50%) translateY(-50%)",
            width: "100px",
            color: player?.color || "white",
          }}
        >
          <p className="text-9xl font-bold">
            {gameState.scores[player?.id || ""]}
          </p>
        </div>

        {/* Right Score (Opponent) */}
        <div
          className="absolute text-center flex items-center justify-center"
          style={{
            right: "25%",
            top: gameState.state.gameHeightPx / 2 + "px",
            transform: "translateX(50%) translateY(-50%)",
            width: "100px",
            color: opponentPlayer?.color || "white",
          }}
        >
          <p className="text-9xl font-bold">
            {gameState.scores[opponentPlayer?.id || ""]}
          </p>
        </div>

        <div
          ref={myPaddleRef}
          className="absolute bottom-0 bg-blue-500"
          style={{
            backgroundColor: `${player?.color || "white"}`,
            width: `${GAME_CONFIG.PADDLE_X}px`,
            height: `${GAME_CONFIG.PADDLE_Y}px`,
            transform: `translateX(${myPaddleX}px)`,
            willChange: "transform",
          }}
        />

        <div
          ref={ballRef}
          className={`bg-white rounded-full ${
            gameState.state.turn == player?.id ? "absolute" : "hidden"
          }`}
          style={{
            width: `${GAME_CONFIG.BALL_SIZE}px`,
            height: `${GAME_CONFIG.BALL_SIZE}px`,
            transform: `translate(${gameState.state.ballPosition.x}px, ${gameState.state.ballPosition.y}px)`,
            willChange: "transform",
          }}
        />

        <div
          className="absolute bg-white opacity-50"
          style={{
            left: "0",
            top: "0",
            width: "100%",
            height: "2px",
          }}
        />

        {gameState.isCompleted && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center gap-4">
            <div className="text-white text-4xl font-bold mb-2">Game Over!</div>
            <div className="text-white text-2xl mb-6">
              {gameState.scores[player?.id || ""] >
              gameState.scores[opponentPlayer?.id || ""]
                ? "You Won!"
                : "Opponent Won!"}
            </div>
            <div className="text-white text-xl mb-8">
              Final Score: {gameState.scores[player?.id || ""]} -{" "}
              {gameState.scores[opponentPlayer?.id || ""]}
            </div>
            <button
              onClick={handleReturnToLobby}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white"
            >
              Return to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default PongMultiGameScreen;
