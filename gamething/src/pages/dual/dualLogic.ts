import { DualGameState, DualLaser } from "@shared/types";
export const AdvanceLasers = (playerId: string, state: DualGameState, deltaTime: number): DualGameState => {
  let playerDamage = 0
  return {
    ...state,
    lasers: state.lasers.map((laser) => {

      if (laser.side != playerId) return laser // skip ones on other screen

      // Check for ship collision first
      if (laser.origin != playerId && Math.abs(laser.x - state.players[playerId].x) < state.players[playerId].sizeX &&
        Math.abs(laser.y - state.players[playerId].y) < state.players[playerId].sizeY) {
        playerDamage += laser.damage
        return null
      }

      laser.x += laser.VelX * deltaTime
      laser.y += laser.VelY * deltaTime

      // handle killing the laser if it hits the bottom of the screen
      if (laser.y > state.sizeY) {
        return null
      }

      // If the laser hits a wall
      if (laser.type != 'reflected' && (laser.x > state.sizeX || laser.x < 0)) {
        return null
      } else if (laser.type == 'reflected') {
        // reflect laser off wall
        laser.VelX *= -1
        laser.x += laser.VelX * deltaTime // compensate for the laser moving one space in the wrong direction
      }

      return laser
    }).filter((laser): laser is DualLaser => laser !== null),
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        hp: state.players[playerId].hp - playerDamage
      }
    },
  }
}

export const GetBorderLasers = (playerId: string, state: DualGameState): DualLaser[] => {
  // Only return lasers that are both on this side and are above the y mark
  return state.lasers.filter((laser) => {
    if (laser.side != playerId) return false
    if (laser.origin != playerId) return false // ignore lasers not shot from player
    return laser.y < 0
  })
}

export const MarkLasersAsSent = (playerId: string, state: DualGameState, laserIds: string[]): DualGameState => {
  return {
    ...state,
    lasers: state.lasers.filter(laser => !(laser.side === playerId && laserIds.includes(laser.id)))
  }
}