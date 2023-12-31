import { ALPHABET } from '@app/alphabet-template';
import * as constants from '@app/constants';
import { MAIN_PLAYER, OTHER_PLAYER } from '@app/constants';

export type Letter = string;
export type ReserveContent = { [letter: string]: number };

export class Reserve {
    letterRacks: [Letter[], Letter[]];
    private reserve: Letter[];

    constructor() {
        this.reserve = [];
        Object.entries(ALPHABET).forEach(([letter, info]) => {
            for (let i = 0; i < info.quantity; i++) {
                this.reserve.push(letter);
            }
        });
        this.setRacks();
    }

    drawLetters(quantity: number): Letter[] {
        const lettersToSend: Letter[] = [];
        const pullableQuantity = Math.min(quantity, this.reserve.length);
        for (let i = 0; i < pullableQuantity; i++) {
            const index: number = Math.floor(Math.random() * this.reserve.length);
            lettersToSend.push(this.reserve[index]);
            // removes the chosen element
            this.reserve[index] = this.reserve[this.reserve.length - 1];
            this.reserve.pop();
        }
        return lettersToSend;
    }

    updateReserve(lettersToChange: string[], isMainPlayer: boolean, putBack: boolean) {
        const playerIndex = isMainPlayer ? MAIN_PLAYER : OTHER_PLAYER;
        const rack = this.letterRacks[playerIndex];

        for (const unwantedLetter of lettersToChange) {
            const i = rack.findIndex(
                (letter) => unwantedLetter === letter.toLowerCase() || (unwantedLetter.toUpperCase() === unwantedLetter && letter === '*'),
            );
            if (i === constants.UNDEFINED) throw new Error("Vous avez essayé d'enlever une lettre qui n'est pas dans votre chevalet");
            if (putBack) this.reserve.push(rack[i]);
            rack[i] = rack[rack.length - 1];
            rack.pop();
        }
        rack.push(...this.drawLetters(lettersToChange.length));
    }

    matchRack(rack: Letter[], isMainPlayer: boolean): void {
        const playerIndex = isMainPlayer ? MAIN_PLAYER : OTHER_PLAYER;
        rack.forEach((letter, idx) => {
            this.letterRacks[playerIndex][idx] = letter;
        });
    }

    getCount(): number {
        return this.reserve.length;
    }

    isPlayerRackEmpty(player: number): boolean {
        return this.letterRacks[player].every((letter) => !letter);
    }

    getContent(): ReserveContent {
        const reserveToShow: ReserveContent = Object.fromEntries(Object.keys(ALPHABET).map((letter) => [letter, 0]));
        for (const letter of this.reserve) reserveToShow[letter]++;
        return reserveToShow;
    }

    private setRacks() {
        const rackLength = constants.RACK_LENGTH;
        const rack1: string[] = [];
        const rack2: string[] = [];
        for (let i = 0; i < rackLength; i++) {
            rack1.push(...this.drawLetters(1));
            rack2.push(...this.drawLetters(1));
        }
        this.letterRacks = [rack1, rack2];
    }
}
