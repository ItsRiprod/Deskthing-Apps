import { Room } from "@shared/types/lobby";
import { GameState } from "../../shared/types/states";
import { ClientGamePayload, GAME_SERVER } from "../../shared/types/transit";
import { GameEngine } from "../types/engineInterface";
import { DualEngine } from "./games/dualEngine";
import { PongEngine } from "./games/pongEngine";
import { FlappyEngine } from "./games/flappyEngine";
import { PongEngineSolo } from "./games/pongEngineSolo";
import { GAME_OPTIONS } from "@shared/types";
import { eventBus } from "../eventBus";
import { DeskthingStore } from "./deskthingStore";
import { roomStore } from "./roomStore";
import { playerStore } from "./playerStore";

class GameRegistry {
  private engines = new Map<GAME_OPTIONS, GameEngine>();

  constructor() {
    this.registerEngine(new DualEngine());
    this.registerEngine(new PongEngine());
    this.registerEngine(new FlappyEngine());
    this.registerEngine(new PongEngineSolo());
    eventBus.on('startGame', this.handleGameStart.bind(this));
  }

  private registerEngine(engine: GameEngine) {
    this.engines.set(engine.gameType, engine);
  }

  public async handleGameStart({ room }: { room: Room }): Promise<void> {
    console.log('Handling the start of the game: ', room.game)
    const gameState = await gameRegistry.createInitialGame(room);
    if (gameState) {
      DeskthingStore.sendBurst(room.playerIds, {
        type: GAME_SERVER.GAME_DATA,
        payload: gameState
      });
      DeskthingStore.sendBurst(room.playerIds, {
        type: GAME_SERVER.META,
        request: 'page',
        payload: gameState.game_type
      });
    }
  }

  async handleGameUpdate(senderId: string, payload: ClientGamePayload): Promise<GameState | null> {
    const engine = this.engines.get(payload.game_type);
    if (!engine) {
      throw new Error(`No engine found for game type: ${payload.game_type}`);
    }
    const newState = await engine.handlePayload(senderId, payload);

    if (newState?.isCompleted) {
      this.handleEndGame(newState.room, newState.winnerIds || []);
    }

    return newState
  }

  async handleStopGame(room: Room): Promise<void> {
    const engine = this.engines.get(room.game);
    if (!engine) {
      throw new Error(`No engine found for game type: ${room.game}`);
    }
    await engine.handleStopGame(room);
    DeskthingStore.sendBurst(room.playerIds, {
      type: GAME_SERVER.META,
      request: 'page',
      payload: 'lobby'
    });
    DeskthingStore.sendBurst(room.playerIds, {
      type: GAME_SERVER.NOTIFICATION,
      payload: {
        type: 'warning',
        message: 'Game Ended or was Stopped',
      }
    });
    roomStore.updateRoomState(room.id, { status: 'waiting' })
  }

  
  async handleEndGame(room: Room, winnerIds: string[] = []): Promise<void> {
    const engine = this.engines.get(room.game);
    if (!engine) {
      throw new Error(`No engine found for game type: ${room.game}`);
    }
    await engine.handleStopGame(room);

    // Only update if there are winners at all
    if (winnerIds.length > 0) {
      console.debug(`Giving ${winnerIds.length} players a win. ${winnerIds.join(', ')}`)
      winnerIds.forEach((id) => {
        playerStore.incrementPlayerWins(id);
      })

      const losers = room.playerIds.filter((id) => !winnerIds.includes(id));

      console.debug(`Giving ${losers.length} players a loss. ${losers.join(', ')}`)
      losers.forEach((id) => {
        playerStore.incrementPlayerLosses(id);
      })
    }

    roomStore.updateRoomState(room.id, { status: 'finished' })
  }

  async createInitialGame(room: Room): Promise<GameState> {
    const engine = this.engines.get(room.game);
    if (!engine) {
      throw new Error(`No engine found for game type: ${room.game}`);
    }
    const state = await engine.createInitialGame(room);
    roomStore.updateRoomState(room.id, { status: 'playing' })
    return state
  }

  getNumberOfPlayers(gameType: GAME_OPTIONS): number {
    const engine = this.engines.get(gameType);
    if (!engine) {
      throw new Error(`No engine found for game type: ${gameType}`);
    }
    return engine.numberOfPlayers;
  }

  async updateGame(state: GameState): Promise<GameState> {
    const engine = this.engines.get(state.game_type);
    if (!engine) {
      throw new Error(`No engine found for game type: ${state.game_type}`);
    }
    return engine.updateGame(state);
  }
}

export const gameRegistry = new GameRegistry();