import { GAME_OPTIONS } from "../../../shared/types/types";
import { GameEngine } from "../../types/engineInterface";
import { Room } from "../../../shared/types/lobby";
import { GameState } from "../../../shared/types/states";
import { ClientGamePayload } from "../../../shared/types/transit";
import { DeskthingStore } from "../deskthingStore";
import { BallUpdatePayload, PongGameState } from "../../../shared/types/games/pong";

type MutliPongGameState = Extract<GameState, { game_type: GAME_OPTIONS.PONG_MULTI }>

export class PongEngine implements GameEngine {
  public readonly gameType: GAME_OPTIONS.PONG_MULTI = GAME_OPTIONS.PONG_MULTI;
  public readonly numberOfPlayers = 2;

  private activeGames: { [roomId: string]: MutliPongGameState } = {};
  async handleStopGame(room: Room): Promise<void> {
    delete this.activeGames[room.id];
  }
  async createInitialGame(room: Room): Promise<MutliPongGameState> {
    const startingLocation = this.calcBallVelocity(750)
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
        gameHeightPx: 400,
        turn: room.playerIds[0],
        difficulty: 1,
        bounces: 1,
        isSetup: false,
        roomId: room.id
      }
    }


    this.deleteExistingRoomID(room.id)

    // ID based on the ownerId
    console.log('Creating new game:', newRoom);
    this.activeGames[room.id] = newRoom;
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
      bounces: gameState.bounces + 1,
      ballVelocity: { x: -gameState.ballVelocity.x, y: -gameState.ballVelocity.y }
    }
  }

  updateGame(state: GameState): Promise<GameState> {
    throw new Error("Method not implemented.");
  }

  handlePayload(senderId: string, payload: ClientGamePayload): Promise<GameState | null> {
    if (payload.game_type != GAME_OPTIONS.PONG_MULTI) {
      throw new Error(`Invalid game type: ${payload.game_type}`);
    }
    switch (payload.action_type) {
      case 'ball_update':
        return this.handleBallUpdate(senderId, payload.action);
      case 'state_update':
        return this.handleStateUpdate(senderId, payload.action);
      default:
        throw new Error(`Invalid action type: ${payload}`);
    }
  }

  private async handleBallUpdate(senderId: string, ballUpdate: BallUpdatePayload): Promise<MutliPongGameState | null> {
    const currentState = this.getCurrentGameState(ballUpdate.roomId);

    if (!currentState) {
      DeskthingStore.sendError(senderId, 'Unable to find game!')
      return null
    }

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
        
        updatedState.state.bounces = 1
        
        // Check for game completion (e.g., first to 11 points)
        const maxScore = Math.max(...Object.values(updatedState.scores));
        if (maxScore >= 11) {
          updatedState.isCompleted = true;
          updatedState.winnerIds = [scoringPlayerId];
        }
      }

      updatedState.state.turn = scoringPlayerId // whos turn it is. Should be the winner's


      // Reset ball position to center after scoring
      const startingLocation = this.calcBallVelocity(currentState.state.gameWidthPx)
      updatedState.state.ballPosition = startingLocation.position;
      updatedState.state.ballVelocity = startingLocation.velocity;
    }

    this.setCurrentGameState(ballUpdate.roomId, updatedState);
    return updatedState;
  }

  private getCurrentGameState(roomId: string): MutliPongGameState | undefined {

    if (!this.activeGames[roomId]) {
      return undefined
    }

    return this.activeGames[roomId];
  }
  

  private setCurrentGameState(roomId: string, state: MutliPongGameState) {
    this.activeGames[roomId] = state;
  }

  // During setup
  private async handleStateUpdate(senderId: string, gameState: PongGameState): Promise<GameState | null> {
    console.log(`Creating game state for room ${gameState.roomId}`)
    const newGameState = this.getCurrentGameState(gameState.roomId)
    if (!newGameState) {
      DeskthingStore.sendError(senderId, 'Unable to find game!')
      return null
    }


    gameState.isSetup = true

    newGameState.state.gameHeightPx = gameState.gameHeightPx
    newGameState.state.gameWidthPx = gameState.gameWidthPx
    newGameState.state.difficulty = gameState.difficulty
    newGameState.state.isSetup = true

    this.setCurrentGameState(senderId, newGameState)
    return newGameState
  }
}