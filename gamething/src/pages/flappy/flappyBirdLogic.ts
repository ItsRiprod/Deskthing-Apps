import { FlappyGameState, FlappyPipe } from "@shared/types";

export const GAME_CONFIG = {
  BIRD_WIDTH: 40,
  BIRD_HEIGHT: 40,
  PIPE_WIDTH: 60,
  PIPE_GAP: 100,
  GRAVITY: 800,
  JUMP_VELOCITY: -200,
  PIPE_SPEED: -120,
  MAX_FALL_SPEED: 500
};

export const updateBirdPosition = (state: FlappyGameState, deltaTime: number): FlappyGameState => {
  const newVelocityY = Math.min(
    state.bird.velocity.y + GAME_CONFIG.GRAVITY * deltaTime,
    GAME_CONFIG.MAX_FALL_SPEED
  );

  return {
    ...state,
    bird: {
      ...state.bird,
      position: {
        x: state.bird.position.x,
        y: state.bird.position.y + newVelocityY * deltaTime
      },
      velocity: {
        x: state.bird.velocity.x,
        y: newVelocityY
      }
    }
  };
};

export const updatePipes = (state: FlappyGameState, deltaTime: number): FlappyGameState => {
  return {
    ...state,
    pipes: state.pipes
      .map(pipe => ({
        ...pipe,
        position: {
          x: pipe.position.x + GAME_CONFIG.PIPE_SPEED * deltaTime,
          y: pipe.position.y
        }
      }))
      .filter(pipe => pipe.position.x + pipe.width > -pipe.width)
  };
};

export const checkCollision = (state: FlappyGameState): boolean => {
  // Check floor and ceiling
  if (state.bird.position.y <= -10 || state.bird.position.y + state.bird.size.height >= state.gameHeightPx + 10) {
    return true;
  }

  // Check pipes
  return state.pipes.some(pipe => {
    const birdRight = state.bird.position.x + state.bird.size.width - 2;
    const birdLeft = state.bird.position.x + 2;
    const birdTop = state.bird.position.y + 2;
    const birdBottom = state.bird.position.y + state.bird.size.height - 2;

    const pipeRight = pipe.position.x + pipe.width + 2;
    const pipeLeft = pipe.position.x;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      const gapTop = pipe.position.y;
      const gapBottom = pipe.position.y + pipe.gapSize;
      return birdTop < gapTop || birdBottom > gapBottom;
    }
    return false;
  });
};

export const jump = (state: FlappyGameState): FlappyGameState => {
  return {
    ...state,
    bird: {
      ...state.bird,
      velocity: {
        x: state.bird.velocity.x,
        y: GAME_CONFIG.JUMP_VELOCITY
      }
    }
  };
};

export const updateScore = (state: FlappyGameState): FlappyGameState => {
  const birdX = state.bird.position.x;
  let newScore = state.score;
  let updatedPipes = state.pipes;

  state.pipes.forEach((pipe, index) => {
    const pipeCenter = pipe.position.x + pipe.width / 2;
    if (birdX > pipeCenter) {
      newScore += 1;
      updatedPipes = updatedPipes.filter((_, i) => i !== index);
    }
  });

  return {
    ...state,
    score: newScore,
    pipes: updatedPipes
  };
};

export const shouldAddPipe = (state: FlappyGameState): boolean => {
  const lastPipe = state.pipes[state.pipes.length - 1];
  const randomOffset = Math.random() * 50 - 25; // Random value between -25 and 25
  return !lastPipe || lastPipe.position.x < state.gameWidthPx - (300 + randomOffset);
};

export const addNewPipe = (state: FlappyGameState): FlappyGameState => {
  if (!shouldAddPipe(state)) return state;

  const minGapY = 60;
  const maxGapY = state.gameHeightPx - GAME_CONFIG.PIPE_GAP - 60;
  const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

  const newPipe: FlappyPipe = {
    position: { x: state.gameWidthPx, y: gapY },
    width: GAME_CONFIG.PIPE_WIDTH,
    gapSize: GAME_CONFIG.PIPE_GAP,
    id: `${state.pipes.length}-${Date.now()}-${Math.random()}`
  };

  return {
    ...state,
    pipes: [...state.pipes, newPipe]
  };
};