import { Room } from "@shared/types/lobby";
import { GameState } from "../../shared/types/states";
import { ClientGamePayload, GAME_SERVER } from "../../shared/types/transit";
import { GameEngine } from "../types/engineInterface";
import { DualEngine } from "./games/dualEngine";
import { PongEngine } from "./games/pongEngine";
import { DualEngineSolo } from "./games/dualEngineSolo";
import { PongEngineSolo } from "./games/pongEngineSolo";
import { GAME_OPTIONS } from "@shared/types";
import { eventBus } from "../eventBus";
import { DeskthingStore } from "./deskthingStore";
import { roomStore } from "./roomStore";

class GameRegistry {
  private engines = new Map<GAME_OPTIONS, GameEngine>();

  constructor() {
    this.registerEngine(new DualEngine());
    this.registerEngine(new PongEngine());
    this.registerEngine(new DualEngineSolo());
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
    }
  }

  async handleGameUpdate(senderId: string, payload: ClientGamePayload): Promise<GameState | null> {
    const engine = this.engines.get(payload.game_type);
    if (!engine) {
      throw new Error(`No engine found for game type: ${payload.game_type}`);
    }
    return engine.handlePayload(senderId, payload);
  }

  async handleStopGame(room: Room): Promise<void> {
    const engine = this.engines.get(room.game);
    if (!engine) {
      throw new Error(`No engine found for game type: ${room.game}`);
    }
    await engine.handleStopGame(room);
    roomStore.updateRoomState(room.id, { status: 'waiting' })
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