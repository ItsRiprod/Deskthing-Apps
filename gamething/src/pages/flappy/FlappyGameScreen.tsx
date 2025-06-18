import { useCallback, useEffect, useRef, useState } from "react";
import {
  GAME_CONFIG,
  updateBirdPosition,
  updatePipes,
  checkCollision,
  jump as birdJump,
  updateScore,
  addNewPipe,
} from "./flappyBirdLogic";
import {
  GAME_OPTIONS,
  GameState,
  FromServerToClient,
  FromClientToServer,
  Room,
} from "@shared/types";
import { createDeskThing } from "@deskthing/client";
import { useGameStore } from "@src/stores/gameStore";
import { useUIStore } from "@src/stores/uiStore";
import { useLobbyStore } from "@src/stores/lobbyStore";
import { SetupBoard } from "./SetupBoard";
import { usePlayerStore } from "@src/stores/playerStore";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>();

type FlappyGame = Extract<GameState, { game_type: GAME_OPTIONS.FLAPPY_BIRD }>;

export const FlappyGameScreen = () => {
  const serverGameState = useGameStore((state) => state.gameState);
  const setServerGameState = useGameStore((state) => state.setGameState);
  const endGame = useGameStore((state) => state.endGame);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const currentRoom = useLobbyStore((state) => state.currentRoom);
  const currentPlayer = usePlayerStore((state) => state.player);

  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(400);
  const [difficulty, setDifficulty] = useState(3);
  const [isSetup, setIsSetup] = useState(false);

  const initialGameState: FlappyGame = {
    game_type: GAME_OPTIONS.FLAPPY_BIRD,
    state: {
      bird: {
        position: { x: 40, y: 250 },
        velocity: { x: 0, y: 0 },
        size: { width: 40, height: 30 },
      },
      gameWidthPx: width,
      gameHeightPx: height,
      pipes: [],
      score: 0,
      passedPipes: [],
      isSetup: isSetup,
    },
    scores: {
      [currentPlayer?.id || "player"]: 0,
    },
    room: serverGameState?.room || (currentRoom as Room),
    isCompleted: false,
  };

  const [gameState, setGameState] = useState<FlappyGame>(initialGameState);
  const [gameStarted, setGameStarted] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  const handleChangeX = (newVal: string) => {
    setWidth(parseInt(newVal));
  };

  const handleChangeY = (newVal: string) => {
    setHeight(parseInt(newVal));
  };

  const handleChangeDifficulty = (newVal: string) => {
    setDifficulty(parseInt(newVal));
  };

  const handleConfirmation = () => {
    setGameState((prev) => ({
      ...prev,
      state: {
        ...prev.state,
        gameWidthPx: width,
        gameHeightPx: height,
        isSetup: true,
      },
    }));
    setIsSetup(true);
  };

  useEffect(() => {
    DeskThing.overrideKeys(["Space", "wheel", "enter"]);
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        handleJump();
      }
      if (event.code === "Enter") {
        handleJump();
      }
    };
    
    const handleWheel = () => {
      handleJump();
    }

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("wheel", handleWheel);
    return () => {
      DeskThing.restoreKeys(["Space", "wheel", "enter"]);
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [gameStarted]);

  const startGame = () => {
    setGameState(initialGameState);
    setIsDead(false);
    setGameStarted(true);
  };

  const updateGame = useCallback(
    (currentTime: number) => {
      if (currentTime - lastTimeRef.current > 64) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      if (deltaTime < 0.028) {
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      setGameState((prevState) => {
        if (prevState.isCompleted) return prevState;

        const difficultyMultiplier = 0.5 + difficulty * 0.2;

        let newState = { ...prevState };
        newState.state = updateBirdPosition(
          prevState.state,
          deltaTime * difficultyMultiplier
        );
        newState.state = updatePipes(
          newState.state,
          deltaTime * difficultyMultiplier
        );
        newState.state = updateScore(newState.state);
        newState.state = addNewPipe(newState.state);

        if (checkCollision(newState.state)) {
          setIsDead(true);
          setGameStarted(false);
          setServerGameState((prev) =>
            prev ? { ...prev, isCompleted: true } : null
          );
          endGame([]);
          return { ...newState, isCompleted: true };
        }

        return newState;
      });

      lastTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(updateGame);
    },
    [endGame, setServerGameState, difficulty]
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
    if (serverGameState?.game_type === GAME_OPTIONS.FLAPPY_BIRD) {
      setGameState(serverGameState as FlappyGame);
    }
  }, [serverGameState]);

  const handleJump = () => {
    if (!gameStarted) {
      startGame();
      return;
    }
    if (gameStarted && !gameState.isCompleted) {
      setGameState((prevState) => {
        const newGameState = { ...prevState };
        newGameState.state = birdJump(prevState.state);
        return newGameState;
      });
    }
  };

  const handleReturnToLobby = () => {
    setCurrentPage("lobby");
    setServerGameState(null);
  };

  return (
    <div>
      {!gameState.state.isSetup && (
        <SetupBoard
          isOwner={true}
          width={width}
          height={height}
          difficulty={difficulty}
          handleChangeX={handleChangeX}
          handleChangeY={handleChangeY}
          handleChangeDifficulty={handleChangeDifficulty}
          handleConfirmation={handleConfirmation}
        />
      )}
      <div
        onPointerDown={handleJump}
        style={{
          height: `${height}px`,
          width: `${width}px`,
          backgroundColor: "#4BA3C3",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          border: "4px solid #2C3E50",
          borderRadius: "10px",
          boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        }}
        className={`bg-[#4BA3C3] relative overflow-hidden cursor-pointer border-4 border-[#2C3E50] rounded-lg shadow-lg`}
      >
        <div
          style={{
            position: "absolute",
            width: `${GAME_CONFIG.BIRD_WIDTH}px`,
            height: `${GAME_CONFIG.BIRD_HEIGHT}px`,
            top: gameState.state.bird.position.y,
            left: gameState.state.bird.position.x,
            transition: ` ${
              gameState.isCompleted ? "transform 3s linear" : ""
            }`,
            background: currentPlayer?.color || '#F1C40F',
            transform: `${
              gameState.isCompleted
                ? `translateY(${height}px)`
                : `rotate(${gameState.state.bird.velocity.y * 0.2}deg)`
            }`,
            willChange: "transform, top, left",
          }}
          className="rounded-full"
        >
          <div className="absolute w-2 h-2 bg-black rounded-full top-1/4 left-[60%]" />
          <div className="absolute w-3 h-2 bg-red-500 rounded-full rotate-45 top-[40%] left-[80%]" />
        </div>
        {gameState.state.pipes.map((pipe) => (
          <div key={pipe.id}>
            <div
              style={{
                position: "absolute",
                width: `${pipe.width}px`,
                height: pipe.position.y,
                left: pipe.position.x,
                willChange: "left",
              }}
              className="bg-gradient-to-r from-green-600 to-green-400 border-b-4 border-green-800"
            />
            <div
              style={{
                position: "absolute",
                width: `${pipe.width}px`,
                height: `${gameState.state.gameHeightPx}px`,
                left: pipe.position.x,
                top: pipe.position.y + pipe.gapSize,
                willChange: "left",
              }}
              className="bg-gradient-to-r from-green-600 to-green-400 border-t-4 border-green-800"
            />
          </div>
        ))}
        <div className="absolute top-5 left-5 text-2xl text-white font-bold font-sans drop-shadow-lg">
          Score: {gameState.state.score}
        </div>
        {!gameStarted && !isDead && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-white font-sans text-center drop-shadow-lg">
            Click or Press Space
            <br />
            to Start
          </div>
        )}
        {(isDead || gameState.isCompleted) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-white text-center drop-shadow-lg">
            Game Over!
            <br />
            Score: {gameState.state.score}
            <br />
            <button
              onClick={handleReturnToLobby}
              className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold text-white mt-4"
            >
              Return to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
