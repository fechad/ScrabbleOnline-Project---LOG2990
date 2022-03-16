import { DictionnaryService } from '@app/services/dictionnary.service';
import { Board } from './board';
import { Game } from './game';

const AI_ID = 'VP';
const AI_GAME_INDEX = 1;
const PROBABILITY = 10;
const BOARD_LENGTH = 15;
const CONTACT_CHAR = '*';
// const THRESHOLD = 0.5;
const DELAY_CHECK_TURN = 1000; // ms

export type PlacementOption = { row: number; col: number; isHorizontal: boolean; word: string };

export class VirtualPlayer {
    board: Board;

    constructor(readonly isBeginner: boolean, private game: Game, private dictionnaryService: DictionnaryService) {
        this.board = game.board;
        console.log(`Virtual player created of difficulty ${isBeginner ? 'beginner' : 'expert'} for game ${game.id}`);
    }

    waitForTurn() {
        setInterval(() => {
            if (this.game.getCurrentPlayer().id === AI_ID) {
                this.playTurn();
            }
        }, DELAY_CHECK_TURN);
    }

    // a mettre private quand connected
    getPlayablePositions(): PlacementOption[] {
        const positions = this.board.getPlayablePositions(this.game.reserve.letterRacks[AI_GAME_INDEX].length);
        const arrayPos: PlacementOption[] = [];
        for (let i = 0; i < BOARD_LENGTH; i++) {
            for (let j = 0; j < BOARD_LENGTH; j++) {
                // pour chaque orientation
                for (const k of [0, 1]) {
                    const valid = [...positions[i][j][k]].some((char) => char !== ' ');
                    if (valid) arrayPos.push({ row: i, col: j, isHorizontal: k === 0, word: positions[i][j][k] });
                }
            }
        }
        return this.validateCrosswords(arrayPos);
    }

    private playTurn() {
        const random = Math.floor(Math.random() * PROBABILITY);
        if (this.isBeginner && random === 0) {
            // this.game.skipTurn(AI_ID); // to test
            this.game.message({ emitter: AI_ID, text: 'I want to skip my turn' });
        } else if (this.isBeginner && random === 1) {
            /* let list = '';
            this.myRack.map((letter) => {
                if (Math.random() >= THRESHOLD) {
                    list += letter.name.toLowerCase();
                }
            });
            this.game.changeLetters(list, AI_ID);*/
            this.game.message({ emitter: AI_ID, text: 'I want to exchange letters' });
        } else {
            this.game.message({ emitter: AI_ID, text: 'I want to place some letters' });
        }
        // temporaire en attendant implementation placer lettre AI
        this.game.skipTurn(AI_ID);
        this.waitForTurn();
    }

    private validateCrosswords(placementOptions: PlacementOption[], exploredOptions: PlacementOption[] = []): PlacementOption[] {
        let validWords: PlacementOption[] = [];
        let starRemains = false;
        for (const option of placementOptions) {
            let letterCount = 0;
            let oneContact = false;
            let availableLetters = this.rackToString();
            for (const letter of option.word) {
                if (letter.toLowerCase() !== letter) {
                    availableLetters = availableLetters.replace(letter, '');
                }
                if (letter === CONTACT_CHAR) {
                    if (oneContact) {
                        starRemains = true;
                        break;
                    }
                    oneContact = true;
                    const replacementOptions = this.contactReplacement(exploredOptions, option, letterCount, availableLetters);
                    validWords = validWords.concat(replacementOptions);
                    if (replacementOptions.length === 0) validWords.push(this.deepCopyPlacementOption(option, option.word.slice(0, letterCount)));
                }
                letterCount++;
            }
            if (!oneContact) validWords.push(option);
        }
        return starRemains ? this.validateCrosswords(validWords, exploredOptions) : validWords;
    }

    private contactReplacement(
        exploredOptions: PlacementOption[],
        option: PlacementOption,
        letterCount: number,
        rackLetters: string,
    ): PlacementOption[] {
        const row = option.isHorizontal ? option.row : option.row + letterCount;
        const col = option.isHorizontal ? option.col + letterCount : option.col;
        const validWords: PlacementOption[] = [];
        const alreadyFound = exploredOptions.find(
            (explored) => explored.row === row && explored.col === col && explored.isHorizontal === option.isHorizontal,
        );
        if (alreadyFound) {
            for (const solution of alreadyFound.word) {
                const letterAvailable = [...rackLetters].some((letter) => letter === solution);
                if (letterAvailable) validWords.push(this.deepCopyPlacementOption(option, option.word.replace(CONTACT_CHAR, solution)));
            }
        } else {
            const crossword = this.board.wordGetter.getStringPositionVirtualPlayer(row, col, !option.isHorizontal);
            const possibleLetters = this.findNewOptions(validWords, option, rackLetters, crossword);
            exploredOptions.push(this.deepCopyPlacementOption(option, possibleLetters));
        }
        return validWords;
    }

    private findNewOptions(validWords: PlacementOption[], option: PlacementOption, rackLetters: string, crossword: string) {
        let possibleLetters = '';
        for (const rackLetter of rackLetters) {
            if ([...possibleLetters].some((letter) => letter === rackLetter)) break;
            const attemptedCrossword = crossword.replace('*', rackLetter.toLowerCase());
            if (this.dictionnaryService.isValidWord(attemptedCrossword)) {
                validWords.push(this.deepCopyPlacementOption(option, option.word.replace(CONTACT_CHAR, rackLetter)));
                possibleLetters += rackLetter;
            }
        }
        return possibleLetters;
    }

    private deepCopyPlacementOption(placement: PlacementOption, newWord?: string): PlacementOption {
        return { row: placement.row, col: placement.col, isHorizontal: placement.isHorizontal, word: newWord ? newWord : placement.word };
    }

    private rackToString(): string {
        return this.game.reserve.letterRacks[AI_GAME_INDEX].map((letter) => letter.name).join('');
    }
}