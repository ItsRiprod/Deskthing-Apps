
import { Room } from '../shared/types';
import { EventEmitter } from 'events';

interface GameEvents {
  startGame: [{ room: Room }]
  playerDisconnect: [{ playerId: string }]
}

class TypedEventEmitter extends EventEmitter<GameEvents> {
  
}

export const eventBus = new TypedEventEmitter();
