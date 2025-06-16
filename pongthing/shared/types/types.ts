export enum GAME_OPTIONS {
  PONG_SOLO = 'pong_solo',
  PONG_MULTI = 'pong_multi',
  DUAL_MULTI = 'dual_multi',
  DUAL_SOLO = 'dual_solo'
}

export type Notification = {
  message: string
  type: 'error' | 'success' | 'info' | 'warning'
}