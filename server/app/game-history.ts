export type PlayerGameInfo = { name: string; pointsScored: number | undefined; replacedBy: string | null };
export enum GameMode {
    Classic = 'Classique',
    Log2990 = 'LOG2990',
}
export interface GameHistory {
    startTime: Date;
    length: string | undefined;
    firstPlayer: PlayerGameInfo;
    secondPlayer: PlayerGameInfo;
    mode: GameMode;
}
