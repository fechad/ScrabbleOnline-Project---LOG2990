import { Parameters } from './parameters';

export type RoomId = number;
export type PlayerId = string;
export type Player = { avatar: string; name: string; id: PlayerId; connected: boolean; virtual: boolean };
export enum State {
    Setup,
    Started,
    Ended,
    Aborted,
}

export class Room {
    readonly parameters: Parameters;
    readonly name: string;
    readonly id: RoomId;
    readonly mainPlayer: Player;
    readonly otherPlayer: Player | undefined;
    readonly state: State;
}
