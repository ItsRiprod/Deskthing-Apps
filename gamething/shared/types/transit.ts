import { Lobby, Player, Room } from "./lobby"
import { BallUpdatePayload, PongGameState } from "./games/pong"
import { GAME_OPTIONS, GamePages, Notification } from "./types"
import { DualGameState, DualLaser, DualShip } from "./games/dual"
import { GameState } from "./states"

/**
 * Data being sent from the server to the client
 */
export enum GAME_SERVER {
  /**
   * The state of a room (i.e. what game is being played and whos in it)
   * This will only be sent for a room you are in
   */
  ROOMS_UPDATE = 'rooms_update',
  /**
   * The state of the lobby (i.e. what rooms are available and who's in them)
   */
  LOBBY_STATE = 'lobby_state',
  /**
   * Payload containing all of the player data for the client
   */
  PLAYER_DATA = 'player_data',
  /**
   * Game-specific data
   */
  GAME_DATA = 'game_data',
  /**
   * Game-specific data
   */
  GAME_UPDATE = 'game_update',
  /**
   * Any notification data to inform the client of
   */
  NOTIFICATION = 'notification',
  /**
   * Any high level or meta changes
   */
  META = 'meta',
}

/**
 * Data being sent from the client to the server
 */
export enum GAME_CLIENT {
  // Room management
  ROOM = 'room',
  LOBBY = 'lobby',
  PLAYER = 'player',
  GAME_UPDATE = 'game_update'
}

export type FromClientToServer = { clientId?: string } & (

  | {
    type: GAME_CLIENT.LOBBY
    request: 'get'
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'get'
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'create'
    payload: {
      color: string
      game: GAME_OPTIONS
    }
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'join'
    payload: {
      roomId: string
    }
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'leave'
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'update'
    payload: {
      color?: string
      game?: GAME_OPTIONS
    }
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'ready'
    payload: boolean
  }
  | {
    type: GAME_CLIENT.ROOM
    request: 'start'
  }
  | {
    type: GAME_CLIENT.PLAYER
    request: 'get'
  }
  | {
    type: GAME_CLIENT.PLAYER
    request: 'update'
    payload: Partial<Player>
  }
  | {
    type: GAME_CLIENT.GAME_UPDATE
    request: 'update',
    payload: ClientGamePayload
  }
  | {
    type: GAME_CLIENT.GAME_UPDATE
    request: 'start',
  }
  | {
    type: GAME_CLIENT.GAME_UPDATE
    request: 'end',
    payload: { winnerIds: string[] }
  }
)

export type FromServerToClient =
  | {
    type: GAME_SERVER.ROOMS_UPDATE
    payload: Room | null
  }
  | {
    type: GAME_SERVER.LOBBY_STATE
    payload: Lobby
  }
  | {
    type: GAME_SERVER.PLAYER_DATA
    payload: Player
  }
  | {
    type: GAME_SERVER.GAME_DATA
    payload: GameState
  }
  | {
    type: GAME_SERVER.GAME_UPDATE
    request: 'update',
    payload: ServerGamePayload
  }
  | {
    type: GAME_SERVER.NOTIFICATION
    payload: Notification
  }
  | {
    type: GAME_SERVER.META
    request: 'page'
    payload: GamePages
  }


export type ClientGamePayload =
  | {
    game_type: GAME_OPTIONS.PONG_MULTI
    action_type: 'ball_update'
    action: BallUpdatePayload
  }
  | {
    game_type: GAME_OPTIONS.PONG_MULTI
    action_type: 'state_update'
    action: PongGameState
  }
  | {
    game_type: GAME_OPTIONS.PONG_SOLO
    action_type: 'null'
    action: PongGameState
  }
  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    action_type: 'laser_add'
    action: DualLaser[]
    gameId: string
  }
  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    action_type: 'set_player'
    action: DualShip
    gameId: string
  }
  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    action_type: 'state_update'
    action: DualGameState
    gameId: string
  }
  | {
    game_type: GAME_OPTIONS.FLAPPY_BIRD
    action_type: 'null'
    action: DualGameState
  }

export type ServerGamePayload =

  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    action_type: 'laser_add'
    action: DualLaser[]
    gameId: string
  }
  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    action_type: 'set_player'
    action: DualShip
    gameId: string
  }
  | {
    game_type: GAME_OPTIONS.DUAL_MULTI
    action_type: 'state_update'
    action: DualGameState
    gameId: string
  }
  | {
    game_type: GAME_OPTIONS.FLAPPY_BIRD
    action_type: 'null'
    action: DualGameState
  }