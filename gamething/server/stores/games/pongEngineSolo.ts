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
        difficulty: 1,
        bounces: 0,
        isSetup: false,
        roomId: room.ownerId
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

  async handlePayload(senderId: string, payload: ClientGamePayload): Promise<GameState | null> {
    return null
  }

  async handleStopGame(room: Room): Promise<void> {
    delete this.activeGames[room.ownerId];
  }
}