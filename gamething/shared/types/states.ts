import { DualGameState } from "./games/dual"
import { PongGameState } from "./games/pong"
import { Room } from "./lobby"
import { GAME_OPTIONS } from "./types"

type BaseGameState = {
  room: Room
  isCompleted: boolean
  /**Player Id -> score map */
  scores: {
    [key: string]: number
  }
  /**
   * The player who won the game (only if the game is finished)
   */
  winnerIds?: string[]
}

export type GameState = BaseGameState & (
  | {
    game_type: GAME_OPTIONS.PONG_SOLO
    state: PongGameState
  }
  | {
    game_type: GAME_OPTIONS.PONG_MULTI
    state: PongGameState
  }
  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    state: DualGameState
  }
  | {
    game_type: GAME_OPTIONS.DUAL_SOLO
    state: DualGameState
  }
)