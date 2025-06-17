import { GAME_OPTIONS } from "../../../shared/types/types";
import { GameEngine } from "../../types/engineInterface";
import { Room } from "../../../shared/types/lobby";
import { GameState } from "../../../shared/types/states";
import { ClientGamePayload, GAME_SERVER } from "../../../shared/types/transit";
import { DeskthingStore } from "../deskthingStore";
import { DualGameState, DualLaser, DualShip } from "../../../shared/types/games/dual";
import { DeskThing } from "@deskthing/server";

type MultiDualGameState = Extract<GameState, { game_type: GAME_OPTIONS.DUAL_MULTI }>;

export class DualEngine implements GameEngine {
  gameType: GAME_OPTIONS.DUAL_MULTI = GAME_OPTIONS.DUAL_MULTI;
  numberOfPlayers = 2;

  private activeGames: { [roomId: string]: MultiDualGameState } = {};

  async handleStopGame(room: Room): Promise<void> {
    delete this.activeGames[room.id];
  }

  invertLaserDirection(gameState: MultiDualGameState, laser: DualLaser, otherPlayerId: string): DualLaser {

    laser.x = gameState.state.sizeX - laser.x;
    laser.y = 0;
    laser.VelX = -laser.VelX;
    laser.VelY = -laser.VelY;

    laser.side = otherPlayerId

    return laser
  }

  async createInitialGame(room: Room): Promise<MultiDualGameState> {
    const newRoom: MultiDualGameState = {
      game_type: GAME_OPTIONS.DUAL_MULTI,
      room,
      isCompleted: false,
      scores: {
        [room.playerIds[0]]: 0,
        [room.playerIds[1]]: 0,
      },
      state: {
        lasers: [],
        players: {
          [room.playerIds[0]]: {
            shipType: 'basic',
            hp: 100,
            x: 0,
            y: 0,
            sizeX: 50,
            sizeY: 50
          },
          [room.playerIds[1]]: {
            shipType: 'basic',
            hp: 100,
            x: 0,
            y: 0,
            sizeX: 50,
            sizeY: 50
          }
        },
        sizeX: 300,
        sizeY: 300,
        isSetup: false,
        roomId: room.id
      }
    };

    this.deleteExistingRoomID(room.id);
    this.activeGames[room.id] = newRoom;
    return newRoom;
  }

  private deleteExistingRoomID(roomId: string) {
    if (this.activeGames[roomId]) {
      if (this.activeGames[roomId].isCompleted) {
        delete this.activeGames[roomId];
      } else {
        DeskthingStore.sendError('Warning: Replacing a game already in play!', roomId);
      }
    }
  }

  async updateGame(state: GameState): Promise<GameState> {
    if (state.game_type !== this.gameType) {
      throw new Error(`Invalid game type: ${state.game_type}`);
    }
    const dualState = state as MultiDualGameState;
    this.activeGames[dualState.room.id] = dualState;
    return dualState;
  }

  async handlePayload(senderId: string, payload: ClientGamePayload): Promise<GameState | null> {
    if (payload.game_type !== this.gameType) {
      throw new Error(`Invalid game type: ${payload.game_type}`);
    }

    switch (payload.action_type) {
      case 'laser_add':
        return this.handleLaserAdd(senderId, payload.gameId, payload.action);
      case 'set_player':
        return this.handleSetPlayer(senderId, payload.gameId, payload.action);
      case 'state_update':
        return this.handleStateUpdate(senderId, payload.action);
      default:
        throw new Error(`Invalid action type: ${payload}`);
    }
  }

  private async handleLaserAdd(senderId: string, gameId: string, lasers: DualLaser[]): Promise<MultiDualGameState | null> {
    const currentState = this.getCurrentGameState(gameId);
    if (!currentState) {
      DeskthingStore.sendError('Unable to find game!', senderId);
      return null;
    }

    const otherPlayerId = currentState.room.playerIds.filter((id) => id != senderId)[0]

    const invertedLasers = lasers.map(laser => this.invertLaserDirection(currentState, laser, otherPlayerId));

    const updatedState = {
      ...currentState,
      state: {
        ...currentState.state,
        lasers: [...currentState.state.lasers, ...invertedLasers]
      }
    };

    DeskThing.send({
      type: GAME_SERVER.GAME_UPDATE,
      request: 'update',
      clientId: otherPlayerId,
      payload: {
        game_type: GAME_OPTIONS.DUAL_MULTI,
        action_type: 'laser_add',
        action: invertedLasers,
        gameId: currentState.room.id
      }
    })
    this.setCurrentGameState(gameId, updatedState);
    return null;
  }

  private async handleSetPlayer(senderId: string, gameId: string, ship: DualShip): Promise<MultiDualGameState | null> {
    const currentState = this.getCurrentGameState(gameId);
    if (!currentState) {
      DeskthingStore.sendError('Unable to find game!', senderId);
      return null;
    }

    const updatedState = {
      ...currentState,
      state: {
        ...currentState.state,
        players: {
          ...currentState.state.players,
          [senderId]: ship
        }
      }
    };

    DeskThing.send({
      type: GAME_SERVER.GAME_UPDATE,
      request: 'update',
      clientId: senderId,
      payload: {
        game_type: GAME_OPTIONS.DUAL_MULTI,
        action_type: 'set_player',
        action: ship,
        gameId: currentState.room.id
      }
    })

    this.setCurrentGameState(currentState.room.id, updatedState);
    return null;
  }

  private async handleStateUpdate(senderId: string, gameState: DualGameState): Promise<MultiDualGameState | null> {
    const currentState = this.getCurrentGameState(gameState.roomId);
    if (!currentState) {
      DeskthingStore.sendError('Unable to find game!', senderId);
      return null;
    }

    const updatedState = {
      ...currentState,
      state: {
        ...gameState,
        isSetup: true
      }
    };

    // Check for game completion based on player HP
    const deadPlayer = Object.entries(gameState.players).find(([_, player]) => player.hp <= 0);
    if (deadPlayer) {
      const winningPlayer = Object.entries(gameState.players).find(([id]) => id !== deadPlayer[0]);
      if (winningPlayer) {
        updatedState.isCompleted = true;
        updatedState.winnerIds = [winningPlayer[0]];
        updatedState.scores[winningPlayer[0]] += 1;
      }
    }

    this.setCurrentGameState(gameState.roomId, updatedState);
    return updatedState;
  }

  private getCurrentGameState(roomId: string): MultiDualGameState | undefined {
    return this.activeGames[roomId];
  }

  private setCurrentGameState(roomId: string, state: MultiDualGameState) {
    this.activeGames[roomId] = state;
  }
}