import { GAME_OPTIONS } from "./types"

export type Lobby = {
  rooms: Room[]
  players: Player[]
}

export type GameStates = 'waiting' | 'playing' | 'finished'

export type Room = {
  players: Player[]
  playerIds: string[]
  ownerId: string // id of the owner
  game: GAME_OPTIONS
  id: string
  isFull: boolean
  maxPlayers: number
  status: GameStates
  color: string
}

export type Player = {
  /**
   * This is the clientID
   */
  id: string
  /**
   * HEX value for the player's color
   */
  color: string

  ready?: boolean

  wins?: number

  losses?: number
}