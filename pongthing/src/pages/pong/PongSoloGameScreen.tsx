import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  getGameDimensions,
  PaddleState,
  updateBallPosition,
  checkWallCollision,
  checkPaddleCollision,
  checkXScoring,
  GAME_CONFIG,
} from "./pongLogic";
import { GAME_OPTIONS, GameState, PongGameState, Room } from "@shared/types";
import { DeskThing } from "@deskthing/client";
import { useGameStore } from "@src/stores/gameStore";
import { usePlayerStore } from "@src/stores/playerStore";
import { useUIStore } from "@src/stores/uiStore";

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

  const dimensions = getGameDimensions(false); // Solo game

  const [gameState, setGameState] = useState<AssertedPongGameState>({
    game_type: GAME_OPTIONS.PONG_SOLO,
    state: {
      ballPosition: { x: 400, y: 150 },
      ballVelocity: { x: -3, y: 2 },
      gameWidthPx: dimensions.width,
      gameHeightPx: dimensions.height,
      turn: "player",
      difficulty: 1,
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
          gameState.state.gameHeightPx - dimensions.paddleHeight,
          y - dimensions.paddleHeight / 2
        )
      );
      setMyPaddleY(paddleY);
    },
    [gameState.state.gameHeightPx, dimensions.paddleHeight]
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
          dimensions.height - dimensions.paddleHeight,
          y - dimensions.paddleHeight
        )
      );
      setMyPaddleY(paddleY);
    },
    [gameState.state.gameHeightPx, dimensions.paddleHeight]
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
        Math.min(dimensions.height - dimensions.paddleHeight, newY)
      );
      setMyPaddleY(paddleY);
    },
    [myPaddleY, gameState.state.gameHeightPx, dimensions.paddleHeight]
  );

  const handleGameOver = useCallback(() => {
    setGameState((prev) => {
      if (prev.scores.ai >= 12 || prev.scores.player >= 12) {
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

  const updateGame = useCallback(
    (currentTime: number) => {
      if (gameState.isCompleted) return;

      const deltaTime = currentTime - lastTimeRef.current;
      if (deltaTime < 16) {
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const myPaddle: PaddleState = { y: myPaddleY };
      const aiPaddle: PaddleState = { y: aiPaddleY };

      let newState = { ...gameState.state };
      newState = updateBallPosition(
        newState,
        (deltaTime / 16) * gameState.state.difficulty * 0.5
      );
      newState = checkPaddleCollision(newState, myPaddle, aiPaddle, false); // false = Solo game
      newState = checkWallCollision(newState, false); // false = Solo game

      // Simple AI
      const aiTargetY = newState.ballPosition.y - dimensions.paddleHeight / 2;
      const aiSpeed = 3;
      const newAiY = aiPaddleY + (aiTargetY > aiPaddleY ? aiSpeed : -aiSpeed);
      setAiPaddleY(
        Math.max(
          0,
          Math.min(dimensions.height - dimensions.paddleHeight, newAiY)
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
          },
          difficulty: Math.min(prev.state.difficulty + 0.25, 7),
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
    [gameState, myPaddleY, aiPaddleY, dimensions.paddleHeight]
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
      // Add wheel listener to game element with capture phase
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
      <div
        ref={gameRef}
        className="relative border-2 border-white select-none"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minHeight: `${dimensions.height}px`,
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
            top: dimensions.height / 2 + "px",
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
            width: `${dimensions.paddleWidth}px`,
            height: `${dimensions.paddleHeight}px`,
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
            top: dimensions.height / 2 + "px",
            transform: "translateX(50%) translateY(-50%)",
            width: "100px",
          }}
        >
          <p className="text-9xl font-bold">{gameState.scores.ai}</p>
        </div>
        {/* Right Paddle (AI) */}{" "}
        <div
          ref={aiPaddleRef}
          className="absolute right-0 bg-red-500"
          style={{
            width: `${dimensions.paddleWidth}px`,
            height: `${dimensions.paddleHeight}px`,
            transform: `translateY(${aiPaddleY}px)`,
            willChange: "transform",
          }}
        />{" "}
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