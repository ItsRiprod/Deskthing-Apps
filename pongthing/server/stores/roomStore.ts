import { Room, Player, GameStates } from "../../shared/types/lobby";
import { GAME_OPTIONS } from "../../shared/types/types";
import { playerStore } from "./playerStore";
import { createDeskThing } from "@deskthing/server";
import { FromClientToServer, FromServerToClient, GAME_SERVER } from "../../shared/types/transit";
import { gameRegistry } from "./gameRegistry";
import { eventBus } from "../eventBus";
import { DeskthingStore } from "./deskthingStore";

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>();
class RoomStore {
  private rooms = new Map<string, Room>();

  constructor() {
    eventBus.on('playerDisconnect', this.handlePlayerDisconnect.bind(this));
  }

  private handlePlayerDisconnect = ({ playerId }: { playerId: string }) => {
    this.rooms.forEach(room => {
      if (room.playerIds.includes(playerId)) {
        this.removePlayerFromRoom(room.id, playerId);
      }
    })
  }

  private notifyUpdateToLobby = () => {
    DeskThing.send({
      type: GAME_SERVER.LOBBY_STATE,
      payload: this.getLobby()
    })
  }

  private notifyRoomUpdate = (roomId: string) => {
    const room = this.getRoom(roomId)
    if (!room) {
      console.warn(`Unable to find room for ${roomId}. Available IDs: ${Array.from(this.rooms.keys()).join(', ')}`)
      return
    }

    const clientIds = room.playerIds
    // Update all of the players in the room
    clientIds.forEach(clientId => {
      DeskThing.send({
        type: GAME_SERVER.ROOMS_UPDATE,
        payload: room,
        clientId: clientId
      })
    })
  }

  private checkForRoomReady = (room: Room) => {
    // const allPlayersReady = room.players.every(player => player.ready);
    // if (allPlayersReady) {
    //   room.status = 'playing'
    //   this.rooms.set(room.id, room);
    //   eventBus.emit('startGame', { room })
    //   this.notifyRoomUpdate(room.id)
    //   this.notifyUpdateToLobby()
    // }
    // Wait until the players are all ready and they hit Join Game / Start Game
  }

  getLobby() {
    return {
      rooms: this.getAllRooms(),
      players: playerStore.getAllPlayers()
    }
  }

  addRoom(room: Room) {
    this.rooms.set(room.id, room);
    this.notifyUpdateToLobby()
  }

  private hydrateRoomData(room: Room): Room {
    const players = room.playerIds.map(id => playerStore.getPlayer(id)).filter(Boolean) as Player[];
    const maxPlayers = gameRegistry.getNumberOfPlayers(room.game);
    const isFull = room.playerIds.length >= maxPlayers;
    return { ...room, players, maxPlayers, isFull };
  }

  createRoom(playerId: string, game: GAME_OPTIONS, color: string) {
    const player = playerStore.getPlayer(playerId)
    const room: Room = {
      id: playerId,
      game,
      maxPlayers: gameRegistry.getNumberOfPlayers(game),
      ownerId: playerId,
      playerIds: [playerId],
      isFull: false,
      players: [player],
      status: 'waiting',
      color
    }
    console.log(`Creating room for game ${game} for player ${playerId}`)
    this.addRoom(room);
    this.notifyRoomUpdate(room.id);
    return room;
  }

  getRoom(id: string) {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    return this.hydrateRoomData(room);
  }

  getRoomByClientId(clientId: string): Room | undefined {
    const room = Array.from(this.rooms.values()).find(room =>
      room.playerIds.includes(clientId)
    );
    if (!room) return undefined;
    return this.hydrateRoomData(room);
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map(this.hydrateRoomData)
  }

  updateRoomState(id: string, newRoom: Partial<Room>) {
    const room = this.rooms.get(id);
    if (!room) return;
    this.rooms.set(id, { ...room, ...newRoom });
    this.notifyUpdateToLobby()
    this.notifyRoomUpdate(id);
  }

  addPlayerToRoom(roomId: string, playerId: string): boolean {
    // kick the player out of their previous room

    const previousRoom = this.getRoomByClientId(playerId);
    if (previousRoom) {
      this.removePlayerFromRoom(previousRoom.id, playerId);
    }

    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (!room.playerIds.includes(playerId)) {
      room.maxPlayers = gameRegistry.getNumberOfPlayers(room.game);
      if (room.playerIds.length >= room.maxPlayers) {
        DeskthingStore.sendError('The room is full', playerId)
        return false;
      };
      room.playerIds.push(playerId)
    }
    this.rooms.set(roomId, room);
    this.notifyUpdateToLobby()
    this.notifyRoomUpdate(roomId);
    return true;
  }

  removePlayerFromRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    this.setPlayerReady(roomId, playerId, false)
    room.playerIds = room.playerIds.filter(id => id !== playerId);
    if (room.playerIds.length == 0) {
      return this.deleteRoom(roomId);
    } else {
      room.ownerId = room.playerIds[0]; // reassign the owner ID
      this.rooms.set(roomId, room);
      this.notifyUpdateToLobby()
      this.notifyRoomUpdate(roomId);
      // Notify the player that they are not in the room anymore specifically
      DeskThing.send({
        type: GAME_SERVER.ROOMS_UPDATE,
        payload: null,
        clientId: playerId
      })
    }

    // check if the room is in a game - and end that game
    if (room.status == 'playing') {
      gameRegistry.handleStopGame(room)
    }

    return true;
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): boolean {
    playerStore.setPlayerReady(playerId, ready);
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (!room.playerIds.includes(playerId)) return false;

    const player = playerStore.getPlayer(playerId);
    if (!player) return false;

    player.ready = ready;

    this.rooms.set(roomId, room);
    this.notifyUpdateToLobby();
    this.notifyRoomUpdate(roomId);
    this.checkForRoomReady(room)
    return true;
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // notify everyone in the room that they have been removed first
    room.playerIds.forEach((id) => {
      DeskThing.send({
        type: GAME_SERVER.ROOMS_UPDATE,
        payload: null,
        clientId: id
      })

      playerStore.setPlayerReady(id, false)
      DeskthingStore.sendInfo('You have been removed from the room', id)
    })

    const success = this.rooms.delete(roomId);
    this.notifyUpdateToLobby()
    return success
  }
}

export const roomStore = new RoomStore();