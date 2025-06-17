import { GAME_OPTIONS } from "../../../shared/types/types";
import { GameEngine } from "../../types/engineInterface";
import { Room } from "../../../shared/types/lobby";
import { GameState } from "../../../shared/types/states";
import { ClientGamePayload } from "../../../shared/types/transit";

export class DualEngineSolo implements GameEngine {
  gameType: GAME_OPTIONS = GAME_OPTIONS.DUAL_SOLO;
  numberOfPlayers = 1;
  createInitialGame(room: Room): Promise<GameState> {
    throw new Error("Method not implemented.");
  }
  updateGame(state: GameState): Promise<GameState> {
    throw new Error("Method not implemented.");
  }
  handlePayload(senderId: string, payload: ClientGamePayload): Promise<GameState> {
    throw new Error("Method not implemented.");
  }
  handleStopGame(room: Room): Promise<void> {
    throw new Error("Method not implemented.");
  }
}