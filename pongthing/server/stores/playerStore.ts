import { createDeskThing } from "@deskthing/server";
import { Player } from "../../shared/types/lobby";
import { eventBus } from "../eventBus";
import { FromClientToServer, FromServerToClient, GAME_SERVER } from "../../shared/types/index";

const generateRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>();

class PlayerStore {
  private players = new Map<string, Player>();

  private notifyPlayerUpdate(playerId: string) {
    DeskThing.send({
      type: GAME_SERVER.PLAYER_DATA,
      payload: this.getPlayer(playerId),
      clientId: playerId
    })
  }

  addPlayer(player: Player): Player {
    this.players.set(player.id, player);
    return player
  }


  addPlayerById(playerId: string): Player {
    /// check if the player already exists
    const existingPlayer = this.players.get(playerId);
    if (existingPlayer) return existingPlayer;

    return this.addPlayer({
      id: playerId,
      color: generateRandomColor()
    })
  }

  getPlayer(id: string): Player {
    const existingPlayer = this.players.get(id);
    if (existingPlayer) return existingPlayer

    return this.addPlayerById(id);
  }

  updatePlayer(id: string, player: Partial<Player>): Player {
    const existingPlayer = this.getPlayer(id);
    this.players.set(id, { ...existingPlayer, ...player });
    this.notifyPlayerUpdate(id);
    return this.getPlayer(id);
  }

  removePlayer(id: string): boolean {
    eventBus.emit('playerDisconnect', { playerId: id })
    return this.players.delete(id);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  setPlayerReady(id: string, ready: boolean) {
    const player = this.players.get(id);
    if (!player) return;
    this.players.set(id, { ...player, ready });
    this.notifyPlayerUpdate(id);
  }

  incrementPlayerWins(id: string) {
    const player = this.players.get(id);
    if (!player) return;
    this.players.set(id, { ...player, wins: (player.wins || 0) + 1 });
    this.notifyPlayerUpdate(id);
  }
}

export const playerStore = new PlayerStore();
