/**
 * The payload sent from the client to the server regarding the new calculated position of the ball
 */
export interface BallUpdatePayload {
  ballPosition: { x: number; y: number };
  ballVelocity: { x: number; y: number };
  scored: boolean
  roomId: string
  scoringPlayerID: string
}

/**
 * The payload where the source of truth is the server - sent to both clients
 */
export type PongGameState = {
  ballPosition: { x: number; y: number };
  ballVelocity: { x: number; y: number };
  gameWidthPx: number
  gameHeightPx: number
  turn: string
  difficulty: number
  bounces: number
  isSetup: boolean
  roomId: string
}