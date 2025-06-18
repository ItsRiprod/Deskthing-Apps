export enum GAME_OPTIONS {
  PONG_SOLO = 'pong_solo',
  PONG_MULTI = 'pong_multi',
  DUAL_MULTI = 'dual_multi',
  FLAPPY_BIRD = 'flappybird'
}

export type Notification = {
  message: string
  type: 'error' | 'success' | 'info' | 'warning'
}

export type Vector2D = {
  x: number
  y: number
}

export type GamePages = 'lobby' | 'room' | GAME_OPTIONS | 'menu' | 'player';
