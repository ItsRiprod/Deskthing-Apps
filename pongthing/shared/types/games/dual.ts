import { Room } from "../lobby"

export type DualGameState = {
  lasers: DualLaser[]
  player1Score: number
  player2Score: number
  gameRunning: boolean
  room: Room
}

export type LaserTypes = 'basic' | 'charged' | 'reflected'

export type DualLaser = {
  laserX: number
  laserY: number
  laserSide: boolean
  laserVelocityY: number
  laserVelocityX: number
  laserColor: string
  laserType: LaserTypes
  /** Player ID */
  laserOrigin: string

}