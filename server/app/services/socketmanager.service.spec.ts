import { Parameters } from '@app/classes/parameters';
import { Room } from '@app/classes/room';
import { Message } from '@app/message';
import { Server } from 'app/server';
import { assert } from 'chai';
import * as sinon from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socketmanager.service';

const RESPONSE_DELAY = 800;

describe('SocketManager service tests', () => {
    let service: SocketManager;
    let server: Server;
    let playersSocket: Socket[];
    let broadcastSocket: Socket;

    const urlString = 'http://localhost:3000';
    beforeEach(async () => {
        server = Container.get(Server);
        server.init();
        // eslint-disable-next-line dot-notation
        service = server['socketManager'];
        playersSocket = [ioClient(`${urlString}/`, { forceNew: true }), ioClient(`${urlString}/`, { forceNew: true })];
        broadcastSocket = ioClient(`${urlString}/waitingRoom`, { forceNew: true });
        // wait for connections
        for (const socket of [broadcastSocket, ...playersSocket]) {
            if (!socket.connected) {
                await new Promise((resolve) => {
                    socket.once('connect', () => resolve(undefined));
                });
            }
        }
    });

    afterEach(() => {
        playersSocket.forEach((socket) => socket.close());
        broadcastSocket.close();
        // eslint-disable-next-line dot-notation
        service['io'].close();
        sinon.restore();
    });

    it('should broadcast available rooms on connect', (done) => {
        const stub = sinon.stub();
        broadcastSocket.on('broadcastRooms', stub);
        setTimeout(() => {
            assert(stub.callCount === 1);
            assert(stub.alwaysCalledWith([]));
            done();
        }, RESPONSE_DELAY);
    });

    it('should create a room', (done) => {
        const stub = sinon.stub();
        broadcastSocket.on('broadcastRooms', stub);
        const parameters = new Parameters();
        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const expectedRoom = new Room(0, playersSocket[0].id, 'Dummy', parameters);
        const expectedRoomSerialized = JSON.parse(JSON.stringify(expectedRoom));
        setTimeout(() => {
            assert(stub.calledWith([expectedRoomSerialized]));
            done();
        }, RESPONSE_DELAY);
    });

    it('should join a room', (done) => {
        const stub = sinon.stub();
        broadcastSocket.on('broadcastRooms', stub);
        const parameters = new Parameters();
        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const expectedRoom = new Room(0, playersSocket[0].id, 'Dummy', parameters);
        const expectedRoomSerialized = JSON.parse(JSON.stringify(expectedRoom));
        setTimeout(() => {
            assert(stub.calledWith([expectedRoomSerialized]));

            const stub2 = sinon.stub();
            playersSocket[1].on('join', stub2);
            playersSocket[1].emit('joinRoom', 0);
            setTimeout(() => {
                assert(stub2.calledWith(0));
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should not display full rooms', (done) => {
        let full = false;
        let connected = false;
        const parameters = new Parameters();
        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        broadcastSocket.on('broadcastRooms', (rooms) => {
            assert(!full || connected || rooms.length !== 0); // TODO check if logical
            if (full) {
                done();
            }
        });
        setTimeout(() => {
            connected = true;
            playersSocket[1].on('join', () => {
                full = true;
            });
            playersSocket[1].emit('joinRoom', 0);
        }, RESPONSE_DELAY);
    });

    it('should return an error if room does not exist', (done) => {
        const stub = sinon.stub();
        setTimeout(() => {
            playersSocket[0].on('error', stub);
            playersSocket[0].emit('joinRoom', 0);
            setTimeout(() => {
                assert(stub.calledWith('Room is no longer available'));
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should return an error if an error is created in room', (done) => {
        playersSocket.push(ioClient(`${urlString}/`, { forceNew: true }));
        const stub = sinon.stub();
        const parameters = new Parameters();
        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        new Room(0, playersSocket[0].id, 'Dummy', parameters);
        setTimeout(() => {
            playersSocket[1].on('join', stub);
            playersSocket[1].emit('joinRoom', 0);
            setTimeout(() => {
                assert(stub.calledWith(0));

                const stub2 = sinon.stub();
                playersSocket[2].on('error', stub2);
                playersSocket[2].emit('joinRoom', 0);
                setTimeout(() => {
                    assert(stub2.calledWith('already 2 players in the game'));
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should create a game', (done) => {
        const stub = sinon.stub();
        const token = 0;
        playersSocket[0].on('joinGame', stub);
        const parameters = new Parameters();
        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        setTimeout(() => {
            const stub2 = sinon.stub();
            playersSocket[1].on('join', stub2);
            playersSocket[1].emit('joinRoom', 0, 'NotDummy');
            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            roomSocket.on('joinGame', stub);
            setTimeout(() => {
                assert(stub2.calledWith(0));
                roomSocket.emit('start');
                setTimeout(() => {
                    assert(stub.calledWith(0));
                    roomSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should send and receive a message in game', (done) => {
        const token = 0;
        const parameters = new Parameters();
        const message: Message = { text: 'this is a test message', emitter: '0' };

        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const stub = sinon.stub();
        playersSocket[1].on('join', stub);
        playersSocket[1].emit('joinRoom', 0, 'NotDummy');
        setTimeout(() => {
            assert(stub.calledWith(0));

            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            const stub2 = sinon.stub();
            roomSocket.on('joinGame', stub2);
            roomSocket.emit('start');
            setTimeout(() => {
                assert(stub2.calledWith(0));

                const gameSocket = ioClient(`${urlString}/games/0`, { auth: { token } });
                const stub3 = sinon.stub();
                gameSocket.on('message', stub3);
                gameSocket.emit('message', message);
                setTimeout(() => {
                    assert(stub3.calledWith(message));
                    // eslint-disable-next-line dot-notation
                    assert(service['games'][0]['messages'][0].text === message.text);
                    // eslint-disable-next-line dot-notation
                    assert(service['games'][0]['messages'][0].emitter === message.emitter);

                    roomSocket.close();
                    gameSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should get parameters', (done) => {
        const token = 0;
        const parameters = new Parameters();
        const parametersSerialized = JSON.parse(JSON.stringify(parameters));

        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const stub = sinon.stub();
        playersSocket[1].on('join', stub);
        playersSocket[1].emit('joinRoom', 0, 'NotDummy');
        setTimeout(() => {
            assert(stub.calledWith(0));

            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            const stub2 = sinon.stub();
            roomSocket.on('joinGame', stub2);
            roomSocket.emit('start');
            setTimeout(() => {
                assert(stub2.calledWith(0));

                const gameSocket = ioClient(`${urlString}/games/0`, { auth: { token } });
                const stub3 = sinon.stub();
                gameSocket.on('parameters', stub3);
                gameSocket.emit('parameters');
                setTimeout(() => {
                    assert(stub3.calledWith(parametersSerialized));

                    roomSocket.close();
                    gameSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should skip turn', (done) => {
        const token = 0;
        const parameters = new Parameters();

        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const stub = sinon.stub();
        playersSocket[1].on('join', stub);
        playersSocket[1].emit('joinRoom', 0, 'NotDummy');
        setTimeout(() => {
            assert(stub.calledWith(0));

            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            const stub2 = sinon.stub();
            roomSocket.on('joinGame', stub2);
            roomSocket.emit('start');
            setTimeout(() => {
                assert(stub2.calledWith(0));

                const gameSocket = ioClient(`${urlString}/games/0`, { auth: { token } });
                const stub3 = sinon.stub();
                gameSocket.on('turn', stub3);
                // eslint-disable-next-line dot-notation
                gameSocket.emit('skipTurn', service['games'][0].players[0].id);
                setTimeout(() => {
                    // eslint-disable-next-line dot-notation
                    assert(!service['games'][0]['isPlayer0Turn']);
                    assert(stub3.calledWith(false));

                    roomSocket.close();
                    gameSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should send an error on wrong player skipping turn', (done) => {
        const token = 0;
        const parameters = new Parameters();

        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const stub = sinon.stub();
        playersSocket[1].on('join', stub);
        playersSocket[1].emit('joinRoom', 0, 'NotDummy');
        setTimeout(() => {
            assert(stub.calledWith(0));

            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            const stub2 = sinon.stub();
            roomSocket.on('joinGame', stub2);
            roomSocket.emit('start');
            setTimeout(() => {
                assert(stub2.calledWith(0));

                const gameSocket = ioClient(`${urlString}/games/0`, { auth: { token } });
                const stub3 = sinon.stub();
                const stub4 = sinon.stub();
                gameSocket.on('game-error', stub3);
                gameSocket.on('turn', stub4);
                // eslint-disable-next-line dot-notation
                gameSocket.emit('skipTurn', service['games'][0].players[1].id);
                setTimeout(() => {
                    // eslint-disable-next-line dot-notation
                    assert(service['games'][0]['isPlayer0Turn']);
                    assert(stub4.notCalled);
                    assert(stub3.calledWith("Ce n'est pas votre tour"));

                    roomSocket.close();
                    gameSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should change letters', (done) => {
        const token = 0;
        const letters = 'abcd';
        const parameters = new Parameters();

        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const stub = sinon.stub();
        playersSocket[1].on('join', stub);
        playersSocket[1].emit('joinRoom', 0, 'NotDummy');
        setTimeout(() => {
            assert(stub.calledWith(0));

            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            const stub2 = sinon.stub();
            roomSocket.on('joinGame', stub2);
            roomSocket.emit('start');
            setTimeout(() => {
                assert(stub2.calledWith(0));

                const gameSocket = ioClient(`${urlString}/games/0`, { auth: { token } });
                const stub3 = sinon.stub();
                gameSocket.on('rack', stub3);
                // eslint-disable-next-line dot-notation
                gameSocket.emit('change-letters', letters, service['games'][0].players[0].id);
                setTimeout(() => {
                    // TODO: adapter avec integration service
                    // eslint-disable-next-line dot-notation
                    assert(stub3.calledWith(letters, service['games'][0].players[0].id));

                    roomSocket.close();
                    gameSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should place letters', (done) => {
        const token = 0;
        const letters = 'abcd';
        const position = 'c8h';
        const expectedPoints = 26;
        const parameters = new Parameters();

        playersSocket[0].emit('createRoom', 'Dummy', parameters);
        const stub = sinon.stub();
        playersSocket[1].on('join', stub);
        playersSocket[1].emit('joinRoom', 0, 'NotDummy');
        setTimeout(() => {
            assert(stub.calledWith(0));

            const roomSocket = ioClient(`${urlString}/rooms/0`, { auth: { token } });
            const stub2 = sinon.stub();
            roomSocket.on('joinGame', stub2);
            roomSocket.emit('start');
            setTimeout(() => {
                assert(stub2.calledWith(0));

                const gameSocket = ioClient(`${urlString}/games/0`, { auth: { token } });
                const stub3 = sinon.stub();
                gameSocket.on('placed', stub3);
                // eslint-disable-next-line dot-notation
                gameSocket.emit('place-letters', letters, position, service['games'][0].players[0].id);
                setTimeout(() => {
                    // TODO: adapter avec integration validation mots et calcul de points
                    // eslint-disable-next-line dot-notation
                    assert(stub3.calledWith(letters, position, expectedPoints, service['games'][0].players[0].id));

                    roomSocket.close();
                    gameSocket.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    // TODO add tests
});
