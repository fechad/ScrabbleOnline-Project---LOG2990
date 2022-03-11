import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameState } from '@app/classes/game';
import { Letter } from '@app/classes/letter';
import { Message } from '@app/classes/message';
import { Parameters } from '@app/classes/parameters';
import { Room, State } from '@app/classes/room';
import { IoWrapper } from '@app/classes/socket-wrapper';
import { SocketMock } from '@app/classes/socket-wrapper.spec';
import { CommunicationService } from '@app/services/communication.service';
import { GameContextService } from './game-context.service';

/* eslint-disable dot-notation, max-lines */

class IoWrapperMock {
    io(): SocketMock {
        return new SocketMock();
    }
}

describe('CommunicationService', () => {
    const ID = 'BOB';
    const TOKEN = 34;
    const GAME_NO = 9;

    let httpMock: HttpTestingController;
    let service: CommunicationService;
    let gameContext: GameContextService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                {
                    provide: Router,
                    useValue: {
                        navigate: () => {
                            /* ignore */
                        },
                    },
                },
                { provide: IoWrapper, useClass: IoWrapperMock },
            ],
        });
        service = TestBed.inject(CommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        gameContext = TestBed.inject(GameContextService);
        const dictionnaries = httpMock.expectOne('http://localhost:3000/api/dictionnaries');
        dictionnaries.flush([]);
        sessionStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should handle id message', () => {
        (service['mainSocket'] as unknown as SocketMock).events.emit('id', ID, TOKEN);
        expect(service.getId().value).toBe(ID);
        expect(service['token']).toBe(TOKEN);
    });

    it('should handle broadcasting messages', () => {
        expect(service.rooms.value).toEqual([]);
        const rooms: Room[] = [
            {
                id: 0,
                name: 'Game',
                parameters: new Parameters(),
                mainPlayer: { name: 'BOB', id: ID, connected: true, virtual: false },
                otherPlayer: undefined,
                state: State.Setup,
            },
        ];
        (service['waitingRoomsSocket'] as unknown as SocketMock).events.emit('broadcast-rooms', rooms);
        expect(service.rooms.value).toEqual(rooms);
    });

    const createRoom = () => {
        (service['mainSocket'] as unknown as SocketMock).events.emit('id', ID, TOKEN);
        (service['mainSocket'] as unknown as SocketMock).events.emit('join', GAME_NO);
        (service['roomSocket'] as unknown as SocketMock).events.emit('update-room', {
            id: GAME_NO,
            name: 'Room name',
            parameters: new Parameters(),
            mainPlayer: { name: 'Player 1', id: ID, connected: true },
            otherPlayer: undefined,
            started: false,
        });
    };

    const otherPlayer = () => {
        const newRoom = service.selectedRoom.value;
        if (newRoom) newRoom.mainPlayer.id = 'albatros';
        service.selectedRoom.next(newRoom);
    };

    it('should allow to know if ID is mainPlayer', () => {
        expect(service.isMainPlayer()).toBe(false);
        createRoom();
        expect(service.isMainPlayer()).toBe(true);
        otherPlayer();
        expect(service.isMainPlayer()).toBe(false);
    });

    it('should kick', () => {
        expect(() => service.kick()).toThrow();
        createRoom();
        service.kick();
        expect((service['roomSocket'] as unknown as SocketMock).emitSpy).toHaveBeenCalledWith('kick');
        otherPlayer();
        expect(() => service.kick()).toThrow();
    });

    it('should be kicked', () => {
        createRoom();
        (service['roomSocket'] as unknown as SocketMock).events.emit('kick');
        expect(service['roomSocket']).toBeUndefined();
        expect(service.selectedRoom.value).toBeUndefined();
    });

    it('should not error on kick & leave when not in game', () => {
        createRoom();
        expect(() => service.kickLeave()).not.toThrow();
        expect(service['roomSocket']).toBeUndefined();
        expect(service.selectedRoom.value).toBeUndefined();
    });

    it('should kick & leave when main player', () => {
        createRoom();
        (service['roomSocket'] as unknown as SocketMock).events.emit('join-game', GAME_NO);
        const spy = (service['gameSocket'] as unknown as SocketMock).emitSpy;
        service.kickLeave();
        expect(spy).toHaveBeenCalledWith('kick');
        expect(service['roomSocket']).toBeUndefined();
        expect(service.selectedRoom.value).toBeUndefined();
    });

    it('should not kick & leave when other player', () => {
        createRoom();
        otherPlayer();
        expect(() => service.kickLeave()).toThrow();
    });

    it('should leave when in room', () => {
        createRoom();
        service.leave();
        expect(service['roomSocket']).toBeUndefined();
        expect(service.selectedRoom.value).toBeUndefined();
    });

    it('should not leave when not in room', () => {
        (service['mainSocket'] as unknown as SocketMock).events.emit('id', ID, TOKEN);
        expect(() => service.leave()).toThrow();
    });

    it('should start', () => {
        createRoom();
        service.start();
        expect((service['roomSocket'] as unknown as SocketMock).emitSpy).toHaveBeenCalledWith('start');
        otherPlayer();
        expect(() => service.start()).toThrow();
    });

    it('should join room', async () => {
        const promise = service.joinRoom('aldabob', GAME_NO);
        expect((service['mainSocket'] as unknown as SocketMock).emitSpy).toHaveBeenCalledWith('join-room', GAME_NO, 'aldabob');
        createRoom();
        setTimeout(() => otherPlayer(), 0);
        await promise;
    });

    it('should not join room 2 times', async () => {
        const promise = service.joinRoom('aldabob', GAME_NO);
        expect((service['mainSocket'] as unknown as SocketMock).emitSpy).toHaveBeenCalledWith('join-room', GAME_NO, 'aldabob');
        createRoom();
        setTimeout(() => otherPlayer(), 0);
        await promise;
        await expectAsync(service.joinRoom('aldabob', 0)).toBeRejected();
    });

    it('should not join room when there is an error', async () => {
        (service['mainSocket'] as unknown as SocketMock).events.emit('id', ID, TOKEN);
        const promise = service.joinRoom('aldabob', GAME_NO);
        (service['mainSocket'] as unknown as SocketMock).events.emit('error', new Error('big bad error'));
        await expectAsync(promise).toBeRejected();
    });

    it('should create room', async () => {
        const promise = service.createRoom('aldabob', new Parameters());
        expect((service['mainSocket'] as unknown as SocketMock).emitSpy).toHaveBeenCalledWith('create-room', 'aldabob', new Parameters(), undefined);
        createRoom();
        setTimeout(() => createRoom(), 0);
        await promise;
    });

    it('should not create room when already in one', async () => {
        const promise = service.createRoom('aldabob', new Parameters());
        expect((service['mainSocket'] as unknown as SocketMock).emitSpy).toHaveBeenCalledWith('create-room', 'aldabob', new Parameters(), undefined);
        createRoom();
        setTimeout(() => createRoom(), 0);
        await promise;

        await expectAsync(service.createRoom('aldabob', new Parameters())).toBeRejected();
    });

    it('should not create room when there is an error', async () => {
        const promise = service.createRoom('aldabob', new Parameters());
        (service['mainSocket'] as unknown as SocketMock).events.emit('error', new Error('big bad error'));
        await expectAsync(promise).toBeRejected();
    });

    it('should start/stop listening to broadcasts', async () => {
        (service['mainSocket'] as unknown as SocketMock).events.emit('id', ID, TOKEN);
        const spy = spyOn(service['waitingRoomsSocket'], 'disconnect').and.callThrough();
        expect(service['waitingRoomsSocket'].connected).toBe(true);
        service.unlistenRooms();
        expect(spy).toHaveBeenCalled();
        expect(service['waitingRoomsSocket'].connected).toBe(false);
        spy.calls.reset();
        service.unlistenRooms();
        expect(spy).not.toHaveBeenCalled();
        expect(service['waitingRoomsSocket'].connected).toBe(false);
        const promise = service.listenRooms();
        (service['waitingRoomsSocket'] as unknown as SocketMock).events.emit('connect');
        await promise;
        await service.listenRooms();
    });

    it('should handle errors on main socket', async () => {
        const spy = spyOn(service, 'handleError' as never);
        (service['mainSocket'] as unknown as SocketMock).events.emit('error', 'BIG BAD ERROR');
        expect(spy).toHaveBeenCalled();
    });

    const DEFAULT_STATE: GameState = {
        players: [
            { info: { id: ID, name: 'BOB', connected: true, virtual: false }, score: 0, rackCount: 7 },
            { info: { id: 'Dummy', name: 'Not BOB', connected: true, virtual: false }, score: 0, rackCount: 7 },
        ],
        reserveCount: 88,
        board: [[]],
        turn: ID,
        ended: false,
    };
    const joinGame = () => {
        createRoom();
        (service['roomSocket'] as unknown as SocketMock).events.emit('join-game', GAME_NO);
        (service['gameSocket'] as unknown as SocketMock).events.emit('state', DEFAULT_STATE);
    };

    it('should handle errors on room socket', async () => {
        joinGame();
        const spy = spyOn(service, 'handleError' as never).and.callThrough();
        (service['roomSocket'] as unknown as SocketMock).events.emit('error', 'BIG BAD ERROR');
        expect(spy).toHaveBeenCalled();
    });

    it('should forfeit', () => {
        joinGame();
        (service['gameSocket'] as unknown as SocketMock).events.emit('state', { ...DEFAULT_STATE, ended: true });
        const emitSpy = (service['gameSocket'] as unknown as SocketMock).emitSpy;
        service.confirmForfeit();
        expect(emitSpy).toHaveBeenCalledWith('confirm-forfeit');
    });

    it('should receive state', () => {
        joinGame();
    });

    it('should receive message', async () => {
        const spy = spyOn(gameContext, 'receiveMessages');
        joinGame();
        const message: Message = { emitter: ID, text: 'Random text' };
        (service['gameSocket'] as unknown as SocketMock).events.emit('message', message, 2);
        expect(spy).toHaveBeenCalledWith(message, 2, true);
        message.emitter = 'NotMe';
        (service['gameSocket'] as unknown as SocketMock).events.emit('message', message, 2);
        expect(spy).toHaveBeenCalledWith(message, 2, false);
    });

    it('should receive game errors', async () => {
        const spy = spyOn(gameContext, 'addMessage');
        joinGame();
        (service['gameSocket'] as unknown as SocketMock).events.emit('game-error', 'BOBO');
        expect(spy).toHaveBeenCalledWith('BOBO', true, false);
    });

    it('should receive valid exchanges', async () => {
        const spy = spyOn(gameContext, 'addMessage');
        joinGame();
        (service['gameSocket'] as unknown as SocketMock).events.emit('valid-exchange', 'BOBO');
        expect(spy).toHaveBeenCalledWith('BOBO', false, true);
    });

    it('should update racks', async () => {
        joinGame();
        const letters: Letter[] = [{ name: 'A', score: 1 }];
        (service['gameSocket'] as unknown as SocketMock).events.emit('rack', letters);
        expect(gameContext.rack.value).toBe(letters);
    });

    it('should save id when unloading', () => {
        let closeHandler: EventListenerOrEventListenerObject = () => {
            expect(true).toBe(false); // should not be called
        };
        const spy = spyOn(window, 'addEventListener').and.callFake((event: string, handler: EventListenerOrEventListenerObject) => {
            closeHandler = handler;
        });
        (service['mainSocket'] as unknown as SocketMock).events.emit('id', ID, TOKEN);
        expect(spy).toHaveBeenCalled();
        expect(closeHandler).not.toBe(undefined);
        closeHandler(new Event('beforeunload'));
        expect(sessionStorage.getItem('ids')).toBe(ID);
    });

    it('retrieve codes', async () => {
        sessionStorage.clear();
        expect(service['getAuth']()).toEqual({});

        sessionStorage.setItem('ids', '');
        expect(service['getAuth']()).toEqual({});

        sessionStorage.setItem('ids', 'alibaba');
        expect(service['getAuth']()).toEqual({ id: 'alibaba' });
        expect(sessionStorage.getItem('ids')).toEqual('');

        sessionStorage.setItem('ids', 'a;b;c;d;d;e');
        expect(service['getAuth']()).toEqual({ id: 'e' });
        expect(sessionStorage.getItem('ids')).toEqual('a;b;c;d;d');
    });

    it('save codes', async () => {
        sessionStorage.clear();
        service['saveAuth']('ab');
        expect(sessionStorage.getItem('ids')).toEqual('ab');

        sessionStorage.setItem('ids', '');
        service['saveAuth']('ab');
        expect(sessionStorage.getItem('ids')).toEqual('ab');

        sessionStorage.setItem('ids', 'alibaba');
        service['saveAuth']('ab');
        expect(sessionStorage.getItem('ids')).toEqual('alibaba;ab');

        sessionStorage.setItem('ids', 'a;b;c;d;d;e');
        service['saveAuth']('ab');
        expect(sessionStorage.getItem('ids')).toEqual('a;b;c;d;d;e;ab');
    });
});
