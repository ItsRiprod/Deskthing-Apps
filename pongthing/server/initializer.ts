import { initSettings } from "./initializers/initSettings"
import './initializers/gameListeners'
import './initializers/lobbyListeners'
import './initializers/playerListeners'

export const initalize = async () => {
  // initialize information
  await initSettings()
}