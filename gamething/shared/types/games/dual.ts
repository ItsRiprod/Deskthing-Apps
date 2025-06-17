import { Room } from "../lobby"

export type DualShip = {
  shipType: ShipTypes
  hp: number
  x: number
  y: number
  sizeX: number
  sizeY: number
}

export type DualGameState = {
  lasers: DualLaser[]
  players: {
    [key: string]: DualShip
  }
  sizeX: number
  sizeY: number
  isSetup: boolean
  roomId: string
}

export type LaserTypes = 'basic' | 'charged' | 'reflected'
export type ShipTypes = 'basic' | 'charged' | 'reflected'

export type DualLaser = {
  x: number
  y: number
  id: string
  /**
   * User ID of whos side the laser is on
   */
  side: string
  origin: string
  damage: number
  VelY: number
  VelX: number
  type: LaserTypes
}