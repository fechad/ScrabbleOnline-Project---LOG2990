import { Room } from '@app/classes/room';
import * as constants from '@app/constants';
import { EventEmitter } from 'events';
import { Service } from 'typedi';
import { isDeepStrictEqual } from 'util';
import { RoomsService } from './rooms.service';

@Service()
export class WaitingRoomService extends EventEmitter {
    static globalEvents: string[] = ['broadcast-rooms'];

    private prevRooms: Room[] = [];

    constructor(private roomsService: RoomsService) {
        super();
        setInterval(() => {
            const newRooms = this.roomsService.rooms.filter((room) => room.needsOtherPlayer());
            if (!isDeepStrictEqual(newRooms, this.prevRooms)) {
                this.emit('broadcast-rooms', newRooms);
                this.prevRooms = newRooms;
            }
        }, constants.ROOMS_LIST_UPDATE_TIMEOUT);
    }

    connect(socket: EventEmitter) {
        socket.emit(
            'broadcast-rooms',
            this.roomsService.rooms.filter((room) => !room.hasOtherPlayer()),
        );
    }
}
