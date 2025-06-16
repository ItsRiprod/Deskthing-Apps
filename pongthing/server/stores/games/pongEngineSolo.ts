import { GAME_OPTIONS } from "../../../shared/types/types";
import { GameEngine } from "../../types/engineInterface";
import { Room } from "../../../shared/types/lobby";
import { GameState } from "../../../shared/types/states";
import { ClientGamePayload } from "../../../shared/types/transit";
import { DeskthingStore } from "../deskthingStore";
import { BallUpdatePayload } from "../../../shared/types/games/pong";

type PongGameState = Extract<GameState, { game_type: GAME_OPTIONS.PONG_SOLO }>

export class PongEngineSolo implements GameEngine {
  gameType = GAME_OPTIONS.PONG_SOLO;
  numberOfPlayers = 1;

  private activeGames: { [roomId: string]: PongGameState } = {};

  async createInitialGame(room: Room): Promise<PongGameState> {
    const startingLocation = this.calculateBallStartingPosAndVelocity(750, 910, true)
    const newRoom: PongGameState = {
      game_type: GAME_OPTIONS.PONG_SOLO,
      room,
      isCompleted: false,
      scores: {
        [room.playerIds[0]]: 0,
        [room.playerIds[1]]: 0,
      },
      state: {
        ballPosition: startingLocation.position,
        ballVelocity: startingLocation.velocity,
        gameWidthPx: 750,
        gameHeightPx: 910,
        turn: room.playerIds[0],
        difficulty: 1
      },
    }

    this.deleteExistingRoomID(room.ownerId)

    // ID based on the ownerId
    this.activeGames[room.ownerId] = newRoom;
    return newRoom
  }
  private deleteExistingRoomID(roomId: string) {
    if (this.activeGames[roomId]) {
      if (this.activeGames[roomId].isCompleted) {
        delete this.activeGames[roomId];
      } else {
        DeskthingStore.sendError('Warning: Replacing a game already in play!', roomId)
      }
    }
  }

  private calculateBallStartingPosAndVelocity(sizeX: number, sizeY: number, goingPositive: boolean): { position: { x: number, y: number }, velocity: { x: number, y: number } } {
    const velocityX = (Math.random() * 2 - 1); // Random X velocity between -1 and 1
    const velocityY = goingPositive ? 1 : -1; // true means positive Y and false means negative Y
    const startingY = sizeY / 2
    const startingX = sizeX / 2
    return { position: { x: startingX, y: startingY }, velocity: { x: velocityX, y: velocityY } }
  }

  updateGame(state: GameState): Promise<GameState> {
    throw new Error("Method not implemented.");
  }

  handlePayload(senderId: string, payload: ClientGamePayload): Promise<GameState> {
    if (payload.game_type != this.gameType) {
      throw new Error(`Invalid game type: ${payload.game_type}`);
    }
    switch (payload.action_type) {
      case 'ball_update':
        return this.handleBallUpdate(senderId, payload.action);
      case 'state_update':
        return this.handleStateUpdate(senderId, payload.action);
      default:
        throw new Error(`Invalid action type: ${payload.action_type}`);
    }
  }

  async handleStopGame(room: Room): Promise<void> {
    delete this.activeGames[room.ownerId];
  }

  private async handleBallUpdate(_senderId: string, ballUpdate: BallUpdatePayload): Promise<PongGameState> {
    const currentState = this.getCurrentGameState(ballUpdate.roomId);

    // Update ball position and velocity
    const updatedState: PongGameState = {
      ...currentState,
      state: {
        ...currentState.state,
        ballPosition: ballUpdate.ballPosition,
        ballVelocity: ballUpdate.ballVelocity,
      }
    };

    // Check for scoring conditions
    if (ballUpdate.scored) {
      // Update scores based on who scored
      const scoringPlayerId = ballUpdate.scoringPlayerID;
      if (scoringPlayerId && updatedState.scores[scoringPlayerId] !== undefined) {
        updatedState.scores[scoringPlayerId] += 1;

        // Check for game completion (e.g., first to 11 points)
        const maxScore = Math.max(...Object.values(updatedState.scores));
        if (maxScore >= 11) {
          updatedState.isCompleted = true;
        }
      }

      // Reset ball position to center after scoring
      const startingDirection = ballUpdate.ballVelocity.x > 0 ? true : false // true means positive Y and false means negative Y
      const startingLocation = this.calculateBallStartingPosAndVelocity(750, 910, startingDirection)
      updatedState.state.ballPosition = startingLocation.position;
      updatedState.state.ballVelocity = startingLocation.velocity;
    }

    return updatedState;
  }

  private getCurrentGameState(roomId: string): PongGameState {

    if (!this.activeGames[roomId]) {
      console.error(`Game for ID ${roomId} not found.`);
    }

    return this.activeGames[roomId];
  }

  private handleStateUpdate(senderId: string, action: any): Promise<GameState> {
    throw new Error("handleStateUpdate method not implemented.");
  }
}