import { Game } from '@app/classes/game';
import { Room, RoomId } from '@app/classes/room';
import * as constants from '@app/constants';
import { Service } from 'typedi';

@Service()
export class RoomsService {
    readonly rooms: Room[] = [];
    readonly games: Game[] = [];

    remove(roomId: RoomId) {
        const roomIdx = this.rooms.findIndex((room) => room.id === roomId);
        if (roomIdx !== constants.UNDEFINED) {
            this.rooms.splice(roomIdx, 1);
        }
        const gameIdx = this.games.findIndex((game) => game.id === roomId);
        if (gameIdx !== constants.UNDEFINED) {
            this.games.splice(gameIdx, 1);
        }
    }
}
