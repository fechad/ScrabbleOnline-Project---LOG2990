import { Injectable } from '@angular/core';
import { CommandParsing } from '@app/classes/command-parsing';
import { GameState, PlayerInfo } from '@app/classes/game';
import { Letter } from '@app/classes/letter';
import { Message } from '@app/classes/message';
import { PlayerId, State } from '@app/classes/room';
import * as cst from '@app/constants';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type Tile = Letter | null;
export type Board = Tile[][];

@Injectable({
    providedIn: 'root',
})
export class GameContextService {
    readonly rack: BehaviorSubject<Letter[]> = new BehaviorSubject([] as Letter[]);
    readonly messages: BehaviorSubject<Message[]> = new BehaviorSubject([] as Message[]);
    readonly tempMessages: BehaviorSubject<string[]> = new BehaviorSubject([] as string[]);
    readonly state: BehaviorSubject<GameState>;
    skipTurnEnabled: boolean = true;
    tempRack: Letter[];
    myId: PlayerId;
    private msgCount: number = 0;

    constructor() {
        const board = [];
        for (let i = 0; i < cst.BOARD_LENGTH; i++) {
            const row = [];
            for (let j = 0; j < cst.BOARD_LENGTH; j++) {
                row.push(null);
            }
            board.push(row);
        }
        const turn = 'none';
        const state: GameState = {
            /* Dummy state */
            players: [
                { id: '0', name: 'P1', connected: true, virtual: false },
                { id: '1', name: 'P2', connected: true, virtual: false },
            ].map((info) => ({ info, score: 0, rackCount: cst.NORMAL_RACK_LENGTH })),
            reserveCount: cst.DEFAULT_RESERVE,
            board,
            turn,
            state: State.Started,
        };
        this.state = new BehaviorSubject(state);
    }

    isEnded(): Observable<boolean> {
        return this.state.pipe(map((state) => state.state === State.Ended || state.state === State.Aborted));
    }

    isMyTurn(): Observable<boolean> {
        return this.state.pipe(map((state) => state.turn === this.myId));
    }

    getMe(): Observable<PlayerInfo> {
        return this.state.pipe(map((state) => state.players.find((player) => player.info.id === this.myId) as PlayerInfo));
    }

    getOther(): Observable<PlayerInfo> {
        return this.state.pipe(map((state) => state.players.find((player) => player.info.id !== this.myId) as PlayerInfo));
    }

    allowSwitch(isAllowed: boolean) {
        this.skipTurnEnabled = isAllowed;
    }

    receiveMessages(message: Message, msgCount: number, myself: boolean) {
        this.messages.next([...this.messages.value, message]);
        if (this.msgCount <= msgCount && myself) {
            this.tempMessages.value.splice(0, msgCount - this.msgCount + 1);
        }
        this.msgCount = msgCount + 1;
    }

    clearMessages() {
        this.messages.next([]);
        this.tempMessages.next([]);
    }

    addMessage(message: string, local: boolean, command: boolean) {
        if (local) {
            this.messages.next([...this.messages.value, { text: message, emitter: 'local' }]);
        } else if (command) {
            this.messages.next([...this.messages.value, { text: message, emitter: 'command' }]);
        } else {
            this.tempMessages.next([...this.tempMessages.value, message]);
        }
    }

    tempUpdateRack() {
        this.rack.next(this.tempRack);
    }

    attemptTempRackUpdate(letters: string) {
        const tempRack = [...this.rack.value];
        for (const letter of letters) {
            const index = tempRack.findIndex((foundLetter) => {
                return letter === foundLetter.name.toLowerCase() || (foundLetter.name === '*' && CommandParsing.isUpperCaseLetter(letter));
            });
            if (index === cst.MISSING) throw new Error('Ces lettres ne sont pas dans le chevalet');
            tempRack[index] = tempRack[tempRack.length - 1];
            tempRack.pop();
        }
        this.tempRack = tempRack;
    }
    addTempRack(letter: Letter) {
        this.tempRack.push(letter);
    }
}
