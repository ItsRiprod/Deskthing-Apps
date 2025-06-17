import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  PaddleState,
  updateBallPosition,
  checkWallCollision,
  checkPaddleCollision,
  checkXScoring,
  GAME_CONFIG,
} from "./pongLogic";
import { GAME_OPTIONS, GameState, Room } from "@shared/types";
import { DeskThing } from "@deskthing/client";
import { useGameStore } from "@src/stores/gameStore";
import { usePlayerStore } from "@src/stores/playerStore";
import { useUIStore } from "@src/stores/uiStore";
import { SetupBoard } from "./SetupBoard";

type AssertedPongGameState = Extract<
  GameState,
  { game_type: GAME_OPTIONS.PONG_SOLO }
>;

const PongSoloGameScreen: React.FC = () => {
  const endGame = useGameStore((state) => state.endGame);
  const updateGameState = useGameStore((state) => state.setGameState);
  const serverGameState = useGameStore((state) => state.gameState);
  const player = usePlayerStore((state) => state.player);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const gameRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const myPaddleRef = useRef<HTMLDivElement>(null);
  const aiPaddleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState<AssertedPongGameState>({
    game_type: GAME_OPTIONS.PONG_SOLO,
    state: {
      ballPosition: { x: 400, y: 150 },
      ballVelocity: { x: -3, y: 2 },
      gameWidthPx: 750,
      gameHeightPx: 300,
      turn: "player",
      difficulty: 1,
      bounces: 0,
      isSetup: false,
      roomId: "",
    },

    scores: {
      player: 0,
      ai: 0,
    },
    room: serverGameState?.room as Room,
    isCompleted: false,
  });

  const [myPaddleY, setMyPaddleY] = useState(gameState.state.gameHeightPx / 2);
  const [aiPaddleY, setAiPaddleY] = useState(gameState.state.gameHeightPx / 2);

  useEffect(() => {
    DeskThing.overrideKeys(["wheel"]);
    return () => {
      DeskThing.restoreKeys(["wheel"]);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gameRef.current) return;
      const rect = gameRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const paddleY = Math.max(
        0,
        Math.min(
          gameState.state.gameHeightPx - GAME_CONFIG.PADDLE_X,
          y - GAME_CONFIG.PADDLE_X / 2
        )
      );
      setMyPaddleY(paddleY);
    },
    [gameState.state.gameHeightPx, GAME_CONFIG.PADDLE_X]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (!gameRef.current || e.touches.length === 0) return;
      const rect = gameRef.current.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      const paddleY = Math.max(
        0,
        Math.min(
          gameState.state.gameHeightPx - GAME_CONFIG.PADDLE_X,
          y - GAME_CONFIG.PADDLE_X / 2
        )
      );
      setMyPaddleY(paddleY);
    },
    [gameState.state.gameHeightPx, GAME_CONFIG.PADDLE_X]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const paddleSpeed = 10;
      const paddleChange =
        (e.deltaY == 0 ? 0 : e.deltaY > 0 ? paddleSpeed : -paddleSpeed) +
        (e.deltaX == 0 ? 0 : e.deltaX > 0 ? -paddleSpeed : paddleSpeed);
      const newY = myPaddleY + paddleChange;
      const paddleY = Math.max(
        0,
        Math.min(gameState.state.gameHeightPx - GAME_CONFIG.PADDLE_X, newY)
      );
      setMyPaddleY(paddleY);
    },
    [myPaddleY, gameState.state.gameHeightPx, GAME_CONFIG.PADDLE_X]
  );

  const handleGameOver = useCallback(() => {
    setGameState((prev) => {
      if (prev.scores.ai >= 11 || prev.scores.player >= 11) {
        updateGameState(prev);
        endGame([prev.scores.player > prev.scores.ai ? player?.id || '' : 'ai']);
        prev.isCompleted = true;
      }

      return prev;
    });
  }, []);

  const handleReturnToLobby = () => {
    setCurrentPage("lobby");
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
    setGameState((prev) => ({
      ...prev,
      state: { ...prev.state, isSetup: true },
    }));
  };

  const updateGame = useCallback(
    (currentTime: number) => {
      if (gameState.isCompleted || !gameState.state.isSetup) return;

      const deltaTime = currentTime - lastTimeRef.current;
      if (deltaTime < 16) {
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const myPaddle: PaddleState = { y: myPaddleY };
      const aiPaddle: PaddleState = { y: aiPaddleY };

      let newState = { ...gameState.state };
      const speedMultiplier = Math.min(1 + (newState.bounces * 0.1), 2.5);
      newState = updateBallPosition(newState, (deltaTime / 16) * speedMultiplier);
      newState = checkPaddleCollision(newState, myPaddle, aiPaddle, false);
      newState = checkWallCollision(newState, false);

      // Simple AI
      const aiTargetY = newState.ballPosition.y - GAME_CONFIG.PADDLE_X / 2;
      const aiSpeed = 3;
      const newAiY = aiPaddleY + (aiTargetY > aiPaddleY ? aiSpeed : -aiSpeed);
      setAiPaddleY(
        Math.max(
          0,
          Math.min(gameState.state.gameHeightPx - GAME_CONFIG.PADDLE_X, newAiY)
        )
      );

      const scorer = checkXScoring(newState);
      if (scorer) {
        setGameState((prev) => ({
          ...prev,
          state: {
            ...prev.state,
            ballPosition: {
              x: prev.state.gameWidthPx / 2,
              y: prev.state.gameHeightPx / 2,
            },
            ballVelocity: {
              x: scorer === "left" ? 5 : -5,
              y: (Math.random() - 0.5) * 7,
            },
            bounces: 0,
          },
          scores: {
            ...prev.scores,
            player:
              scorer === "right" ? prev.scores.player + 1 : prev.scores.player,
            ai: scorer === "left" ? prev.scores.ai + 1 : prev.scores.ai,
          },
        }));
      } else {
        setGameState((prev) => ({ ...prev, state: newState }));
      }

      handleGameOver();

      lastTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(updateGame);
    },
    [gameState, myPaddleY, aiPaddleY, GAME_CONFIG.PADDLE_X]
  );

  useEffect(() => {
    if (!gameState.isCompleted) {
      animationFrameRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isCompleted, updateGame]);

  useEffect(() => {
    // Add listeners to the game element specifically, not document
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

  return (
    <div className="bg-black w-screen h-screen flex flex-col justify-center items-center">
      {!gameState.state.isSetup && (
        <SetupBoard
          isOwner={true}
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
        className="relative border-2 border-white select-none"
        style={{
          width: `${gameState.state.gameWidthPx}px`,
          height: `${gameState.state.gameHeightPx}px`,
          minHeight: `${gameState.state.gameHeightPx}px`,
          backgroundColor: "#000000",
        }}
      >
        {/* Left Score (Player) */}
        <div
          className={`absolute text-center ${
            gameState.isCompleted ? "text-white" : "text-neutral-700"
          } flex items-center justify-center`}
          style={{
            left: "25%",
            top: `${gameState.state.gameHeightPx / 2}px`,
            transform: "translateX(-50%) translateY(-50%)",
            width: "100px",
          }}
        >
          <p className="text-9xl font-bold">{gameState.scores.player}</p>
        </div>
        {/* Left Paddle (Player) */}
        <div
          ref={myPaddleRef}
          className="absolute left-0"
          style={{
            backgroundColor: player?.color || 'blue',
            width: `${GAME_CONFIG.PADDLE_Y}px`,
            height: `${GAME_CONFIG.PADDLE_X}px`,
            transform: `translateY(${myPaddleY}px)`,
            willChange: "transform",
          }}
        />
        {/* Right Score (AI) */}
        <div
          className={`absolute text-center ${
            gameState.isCompleted ? "text-white" : "text-neutral-700"
          } flex items-center justify-center`}
          style={{
            right: "25%",
            top: `${gameState.state.gameHeightPx / 2}px`,
            transform: "translateX(50%) translateY(-50%)",
            width: "100px",
          }}
        >
          <p className="text-9xl font-bold">{gameState.scores.ai}</p>
        </div>
        {/* Right Paddle (AI) */}
        <div
          ref={aiPaddleRef}
          className="absolute right-0 bg-red-500"
          style={{
            width: `${GAME_CONFIG.PADDLE_Y}px`,
            height: `${GAME_CONFIG.PADDLE_X}px`,
            transform: `translateY(${aiPaddleY}px)`,
            willChange: "transform",
          }}
        />
        {/* Ball */}
        <div
          ref={ballRef}
          className="absolute bg-white rounded-full"
          style={{
            width: `${GAME_CONFIG.BALL_SIZE}px`,
            height: `${GAME_CONFIG.BALL_SIZE}px`,
            transform: `translate(${gameState.state.ballPosition.x}px, ${gameState.state.ballPosition.y}px)`,
            willChange: "transform",
          }}
        />
        {/* Center Line */}
        <div
          className="absolute bg-white opacity-50"
          style={{
            left: "50%",
            top: "0",
            width: "2px",
            height: "100%",
            transform: "translateX(-50%)",
          }}
        />
        {gameState.isCompleted && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center gap-4">
            <div className="text-white text-4xl font-bold mb-2">
              Game Over!
            </div>
            <div className="text-white text-2xl mb-6">
              {gameState.scores.player > gameState.scores.ai 
                ? 'You Won!' 
                : 'AI Won!'}
            </div>
            <div className="text-white text-xl mb-8">
              Final Score: {gameState.scores.player} - {gameState.scores.ai}
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

export default PongSoloGameScreen;