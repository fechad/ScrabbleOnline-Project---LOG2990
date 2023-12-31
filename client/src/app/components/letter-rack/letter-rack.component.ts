import { Component, HostListener } from '@angular/core';
import { Letter } from '@app/classes/letter';
import * as constants from '@app/constants';
import { Command, GameContextService } from '@app/services/game-context.service';
import { GridService } from '@app/services/grid.service';

@Component({
    selector: 'app-letter-rack',
    templateUrl: './letter-rack.component.html',
    styleUrls: ['./letter-rack.component.scss'],
})
export class LetterRackComponent {
    letters: Letter[] = [];
    manipulating: number | undefined;
    exchanging: number[] = [];
    timeOut: number;
    previousSelection = constants.MISSING;

    constructor(public gameContextService: GameContextService, public gridService: GridService) {
        this.gameContextService.rack.rack.subscribe((newRack) => (this.letters = newRack));
    }
    @HostListener('document:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        const buttonPressed = event.key;
        const clickedOutOfRack =
            event.target instanceof Element && (event.target.id === 'writingBox' || event.target.classList.contains('play-area'));
        if (clickedOutOfRack) {
            return;
        }
        if (buttonPressed === 'ArrowLeft' || buttonPressed === 'ArrowRight') this.shiftLetter(buttonPressed);
        else {
            const occurrences = this.checkOccurrences(buttonPressed);
            if (occurrences.length === 0) {
                this.manipulating = undefined;
            } else if (this.manipulating === undefined || !occurrences.includes(this.manipulating)) {
                this.manipulating = occurrences[0];
            } else {
                const idx = occurrences.indexOf(this.manipulating);
                const newIdx = (idx + 1) % occurrences.length;
                this.manipulating = occurrences[newIdx];
            }
        }
    }

    @HostListener('document:wheel', ['$event'])
    scrollDetect(event: WheelEvent) {
        this.shiftLetter(event.deltaY);
    }

    @HostListener('document:click', ['$event'])
    clear(event: MouseEvent) {
        const selection = event.target as HTMLElement;
        const PARENT_POSSIBILITIES = [
            'name',
            'letter-name',
            'big-let',
            'small-let',
            'letter-container',
            'rack-container',
            'rackArea',
            'context-menu',
            'letter-rack',
            'letter-score',
            'big-sco',
            'small-sco',
            'score',
        ];
        const name = selection?.getAttribute('class') as string;

        if (!PARENT_POSSIBILITIES.includes(name)) {
            this.manipulating = undefined;
            this.exchanging = [];
        }
    }

    checkOccurrences(key: string) {
        const identicalLetters = this.letters.map((letter, idx) => {
            if (letter.name.toLowerCase() === key.toLowerCase()) return idx;
            else return undefined;
        });
        return identicalLetters.filter((value) => value !== undefined);
    }

    shiftLetter(keypress: string | number) {
        if (this.manipulating === undefined) return;
        let newIndex = constants.MISSING;

        if (keypress === 'ArrowRight' || keypress > 0) {
            newIndex = (this.manipulating + 1) % this.letters.length;
        } else if (keypress === 'ArrowLeft' || keypress < 0) {
            newIndex = (this.manipulating + this.letters.length - 1) % this.letters.length;
        }
        this.swapLetters(newIndex, this.manipulating);
        this.gameContextService.syncRack();
    }

    swapLetters(index: number, oldIndex: number) {
        if (oldIndex === 0 && index === this.letters.length - 1) {
            const firstElement = this.letters.shift();
            // rack will never be empty if a letter is selected for manipulation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.letters.push(firstElement!);
        } else if (oldIndex === this.letters.length - 1 && index === 0) {
            // rack will never be empty if a letter is selected for manipulation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.letters.unshift(this.letters.pop()!);
        } else {
            const temporaryLetter = this.letters[oldIndex];
            this.letters[oldIndex] = this.letters[index];
            this.letters[index] = temporaryLetter;
        }
        this.manipulating = index;
    }

    manipulate(idx: number): void {
        if (this.exchanging.includes(idx)) return;
        this.manipulating = idx;
        this.exchanging = [];
    }

    select(idx: number) {
        if (this.exchanging.includes(idx)) {
            const letter = this.exchanging.indexOf(idx);
            this.exchanging.splice(letter, 1);
        } else this.exchanging.push(idx);
        this.manipulating = undefined;
    }

    exchange() {
        const selectedLetters = this.exchanging.map((letter) => this.letters[letter].name.toLowerCase()).join('');
        this.gameContextService.executeCommand(Command.Exchange, selectedLetters);
    }

    getReserveCount(): boolean {
        return this.gameContextService.state.value.reserveCount < constants.NORMAL_RACK_LENGTH;
    }
}
