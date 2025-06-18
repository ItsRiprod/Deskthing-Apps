import { Vector2D } from "../types"

export type FlappyGameState  = {
  gameWidthPx: number;
  gameHeightPx: number;
  bird: {
    position: Vector2D;
    velocity: Vector2D;
    size: {
      width: number;
      height: number;
    };
  };
  pipes: FlappyPipe[];
  score: number;
  passedPipes?: string[];
  isSetup: boolean
}

export type FlappyPipe = {
  position: Vector2D;
  gapSize: number;
  width: number;
  id: string
}