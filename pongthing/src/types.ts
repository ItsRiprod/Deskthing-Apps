export interface BaseStore {
  initialized: boolean
  init: () => Promise<void>
  unmount: () => Promise<void>
}