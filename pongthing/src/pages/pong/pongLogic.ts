import { PongGameState } from "@shared/types";

export const GAME_CONFIG = {
  BALL_SIZE: 15,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 20,
}

export type PaddleState = {
  x?: number // For horizontal movement (Multi)
  y?: number // For vertical movement (Solo)
}

// Multi game uses vertical court, Solo uses horizontal court
export const getGameDimensions = (isMulti: boolean) => {
  if (isMulti) {
    return {
      width: 750,
      height: 400,
      paddleWidth: GAME_CONFIG.PADDLE_WIDTH,
      paddleHeight: GAME_CONFIG.PADDLE_HEIGHT,
    }
  } else {
    return {
      width: 800,
      height: 400,
      paddleWidth: GAME_CONFIG.PADDLE_HEIGHT, // Rotated 90deg
      paddleHeight: GAME_CONFIG.PADDLE_WIDTH, // Rotated 90deg
    }
  }
}

export const updateBallPosition = (ball: PongGameState, deltaTime: number): PongGameState => {
  return {
    ...ball,
    ballPosition: {
      x: ball.ballPosition.x + ball.ballVelocity.x * deltaTime,
      y: ball.ballPosition.y + ball.ballVelocity.y * deltaTime,
    }
  };
};

export const checkWallCollision = (ball: PongGameState, isMulti: boolean = true): PongGameState => {
  let newBall = { ...ball };
  const dimensions = getGameDimensions(isMulti);

  if (isMulti) {
    // Multi: Check left and right walls (vertical court)
    if (newBall.ballPosition.x <= 0 || newBall.ballPosition.x >= dimensions.width - GAME_CONFIG.BALL_SIZE) {
      newBall.ballVelocity = { x: -newBall.ballVelocity.x, y: newBall.ballVelocity.y };
      newBall.ballPosition = {
        x: Math.max(0, Math.min(dimensions.width - GAME_CONFIG.BALL_SIZE, newBall.ballPosition.x)),
        y: newBall.ballPosition.y
      };
    }
  } else {
    // Solo: Check top and bottom walls (horizontal court)
    if (newBall.ballPosition.y <= 0 || newBall.ballPosition.y >= dimensions.height - GAME_CONFIG.BALL_SIZE) {
      newBall.ballVelocity = { x: newBall.ballVelocity.x, y: -newBall.ballVelocity.y };
      newBall.ballPosition = {
        x: newBall.ballPosition.x,
        y: Math.max(0, Math.min(dimensions.height - GAME_CONFIG.BALL_SIZE, newBall.ballPosition.y))
      };
    }
  }

  return newBall;
};

export const checkPaddleCollision = (
  gameState: PongGameState,
  paddle: PaddleState,
  aiPaddle?: PaddleState,
  isMulti: boolean = true
): PongGameState => {
  const dimensions = getGameDimensions(isMulti);
  let newGameState = { ...gameState };

  if (isMulti) {
    // Multi: Vertical court, paddle moves horizontally at bottom
    const paddleY = dimensions.height - dimensions.paddleHeight;
    const paddleTop = paddleY;
    const paddleBottom = paddleY + dimensions.paddleHeight;
    const paddleLeft = paddle.x || 0;
    const paddleRight = paddleLeft + dimensions.paddleWidth;
    // Check if ball is in paddle area
    if (newGameState.ballPosition.x + GAME_CONFIG.BALL_SIZE >= paddleLeft &&
      newGameState.ballPosition.x <= paddleRight) {

      // Bottom paddle collision (ball moving down)  
      if (newGameState.ballPosition.y + GAME_CONFIG.BALL_SIZE >= paddleTop &&
        newGameState.ballPosition.y <= paddleBottom &&
        newGameState.ballVelocity.y > 0) {

        newGameState.ballVelocity = { x: newGameState.ballVelocity.x, y: -newGameState.ballVelocity.y };

        newGameState.ballPosition = {
          x: newGameState.ballPosition.x,
          y: paddleTop - GAME_CONFIG.BALL_SIZE
        }

        // Add some horizontal velocity based on where it hit the paddle
        const hitPosition = (newGameState.ballPosition.x + GAME_CONFIG.BALL_SIZE / 2 - paddleLeft) / dimensions.paddleWidth;
        newGameState.ballVelocity.x += (hitPosition - 0.5) * 5;
      }
    }
  } else {
    // Solo: Horizontal court, paddle moves vertically on left side
    const paddleX = 0;
    const paddleTop = paddle.y || 0;
    const paddleBottom = paddleTop + dimensions.paddleHeight;
    // const paddleLeft = paddleX;
    const paddleRight = paddleX + dimensions.paddleWidth;

    // Check player paddle collision
    if (newGameState.ballPosition.y + GAME_CONFIG.BALL_SIZE >= paddleTop &&
      newGameState.ballPosition.y <= paddleBottom) {

      // Left paddle collision (ball moving left)
      if (newGameState.ballPosition.x <= paddleRight &&
        newGameState.ballVelocity.x < 0) {
        newGameState.ballVelocity = { x: -newGameState.ballVelocity.x * 1.1, y: newGameState.ballVelocity.y };
        newGameState.ballPosition.x = Math.max(paddleRight, newGameState.ballPosition.x)        // Add some vertical velocity based on where it hit the paddle
        const hitPosition = (newGameState.ballPosition.y + GAME_CONFIG.BALL_SIZE / 2 - paddleTop) / dimensions.paddleHeight;
        const velocityChange = (hitPosition - 0.5) * 10;
        newGameState.ballVelocity.y = Math.min(Math.max(newGameState.ballVelocity.y + velocityChange, -8), 8);
      }
    }

    // Handle AI paddle collision if it exists (right side)
    if (aiPaddle) {
      const aiPaddleX = dimensions.width - dimensions.paddleWidth;
      const aiPaddleTop = aiPaddle.y || 0;
      const aiPaddleBottom = aiPaddleTop + dimensions.paddleHeight;
      const aiPaddleLeft = aiPaddleX;
      // const aiPaddleRight = aiPaddleX + dimensions.paddleWidth;

      if (newGameState.ballPosition.y + GAME_CONFIG.BALL_SIZE >= aiPaddleTop &&
        newGameState.ballPosition.y <= aiPaddleBottom) {

        // Right paddle collision (ball moving right)
        if (newGameState.ballPosition.x + GAME_CONFIG.BALL_SIZE >= aiPaddleLeft &&
          newGameState.ballVelocity.x > 0) {
          newGameState.ballVelocity = { x: -newGameState.ballVelocity.x * 1.1, y: newGameState.ballVelocity.y };
          newGameState.ballPosition.x = Math.min(aiPaddleLeft, newGameState.ballPosition.x)
          // Add some vertical velocity based on where it hit the paddle

          const hitPosition = (newGameState.ballPosition.y + GAME_CONFIG.BALL_SIZE / 2 - aiPaddleTop) / dimensions.paddleHeight;
          const velocityChange = (hitPosition - 0.5) * 10;
          newGameState.ballVelocity.y = Math.min(Math.max(newGameState.ballVelocity.y + velocityChange, -8), 8);
        }
      }
    }
  }

  return newGameState;
};

export const checkYScoring = (gameState: PongGameState): 'switch' | 'bottom' | null => {
  const dimensions = getGameDimensions(true); // Multi game dimensions
  if (gameState.ballPosition.y > dimensions.height) {
    return 'bottom'
  }; // The ball passed through our bottom
  if (gameState.ballPosition.y < 0 && gameState.ballVelocity.y < 0) return 'switch'; // Switch to the other player only if the ball is moving up
  return null;
};

export const checkXScoring = (gameState: PongGameState): 'right' | 'left' | null => {
  const dimensions = getGameDimensions(false); // Solo game dimensions
  if (gameState.ballPosition.x > dimensions.width) return 'right'; // Ball went past right boundary
  if (gameState.ballPosition.x < 0) return 'left'; // Ball went past left boundary
  return null;
};
