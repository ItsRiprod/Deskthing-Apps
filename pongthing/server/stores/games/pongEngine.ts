import { GAME_OPTIONS } from "../../../shared/types/types";
import { GameEngine } from "../../types/engineInterface";
import { Room } from "../../../shared/types/lobby";
import { GameState } from "../../../shared/types/states";
import { ClientGamePayload } from "../../../shared/types/transit";
import { DeskthingStore } from "../deskthingStore";
import { BallUpdatePayload, PongGameState } from "../../../shared/types/games/pong";

type MutliPongGameState = Extract<GameState, { game_type: GAME_OPTIONS.PONG_MULTI }>

export class PongEngine implements GameEngine {
  gameType = GAME_OPTIONS.PONG_MULTI;
  numberOfPlayers = 2;

  private activeGames: { [roomId: string]: MutliPongGameState } = {};

  async handleStopGame(room: Room): Promise<void> {
    delete this.activeGames[room.ownerId];
  }

  async createInitialGame(room: Room): Promise<MutliPongGameState> {
    const startingLocation = this.calcBallVelocity(750) // half the size of the full court because only half is active at once
    const newRoom: MutliPongGameState = {
      game_type: GAME_OPTIONS.PONG_MULTI,
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
        gameHeightPx: 910, // only half is ever visible though
        turn: room.playerIds[0],
        difficulty: 1,
      },
    }

    this.deleteExistingRoomID(room.ownerId)

    // ID based on the ownerId
    console.log('Creating new game:', newRoom);
    this.activeGames[room.ownerId] = newRoom;
    return newRoom
  }
  private deleteExistingRoomID(roomId: string) {
    if (this.activeGames[roomId]) {
      if (this.activeGames[roomId].isCompleted) {
        delete this.activeGames[roomId];
      } else {
        DeskthingStore.sendError('Warning: Replacing a game already in play!', roomId);
      }
    }
  }

  private calcBallVelocity(sizeX: number): { position: { x: number, y: number }, velocity: { x: number, y: number } } {
    const velocityX = (Math.random() * 2 - 1); // Random X velocity between -1 and 1
    const velocityY = 5 // start going down always
    const startingY = 0 // start at the top of the screen always
    const startingX = sizeX / 2
    return { position: { x: startingX, y: startingY }, velocity: { x: velocityX, y: velocityY } }
  }

  private invertBoard(gameState: PongGameState): PongGameState {
    const invertedX = gameState.gameWidthPx - gameState.ballPosition.x
    const invertedY = 0 // always set to zero because that is the reset position
    return {
      ...gameState,
      ballPosition: { x: invertedX, y: invertedY },
      difficulty: gameState.difficulty + 1,
      ballVelocity: { x: -gameState.ballVelocity.x, y: -gameState.ballVelocity.y }
    }
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

  private async handleBallUpdate(senderId: string, ballUpdate: BallUpdatePayload): Promise<MutliPongGameState> {
    const currentState = this.getCurrentGameState(ballUpdate.roomId);

    // Update ball position and velocity
    const updatedState: MutliPongGameState = {
      ...currentState,
      state: {
        ...currentState.state,
        ballPosition: ballUpdate.ballPosition,
        ballVelocity: ballUpdate.ballVelocity,
      }
    };

    if (ballUpdate.ballPosition.y < 0) {
      const otherPlayersID = currentState.room.playerIds.filter(id => id !== senderId)[0]
      console.debug(`${senderId}: Changing PONG turn to ${otherPlayersID}`)
      updatedState.state.turn = otherPlayersID
      updatedState.state = this.invertBoard(updatedState.state)
    }

    // Check for scoring conditions
    if (ballUpdate.scored) {
      // Update scores based on who scored
      const scoringPlayerId = ballUpdate.scoringPlayerID;
      if (scoringPlayerId && updatedState.scores[senderId] !== undefined) {
        updatedState.scores[scoringPlayerId] += 1;

        // Check for game completion (e.g., first to 11 points)
        const maxScore = Math.max(...Object.values(updatedState.scores));
        if (maxScore >= 11) {
          updatedState.isCompleted = true;
        }
      }

      updatedState.state.turn = scoringPlayerId // whos turn it is. Should be the winner's

      updatedState.state.difficulty = 1

      // Reset ball position to center after scoring
      const startingLocation = this.calcBallVelocity(currentState.state.gameWidthPx)
      updatedState.state.ballPosition = startingLocation.position;
      updatedState.state.ballVelocity = startingLocation.velocity;
    }

    return updatedState;
  }

  private getCurrentGameState(roomId: string): MutliPongGameState {

    if (!this.activeGames[roomId]) {
      throw new Error(`Game for ID ${roomId} not found.`);
    }

    return this.activeGames[roomId];
  }

  private handleStateUpdate(senderId: string, action: any): Promise<GameState> {
    throw new Error("handleStateUpdate method not implemented.");
  }
}