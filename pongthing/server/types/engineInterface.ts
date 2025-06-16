
import { Room } from "../../shared/types/lobby";
import { GameState } from "../../shared/types/states";
import { ClientGamePayload } from "../../shared/types/transit";
import { GAME_OPTIONS } from "../../shared/types/types";

export interface GameEngine {
  readonly gameType: GAME_OPTIONS;
  readonly numberOfPlayers: number

  createInitialGame(room: Room): Promise<GameState>

  handleStopGame(room: Room): Promise<void>

  updateGame(state: GameState): Promise<GameState>

  handlePayload(senderId: string, payload: ClientGamePayload): Promise<GameState | null>
}