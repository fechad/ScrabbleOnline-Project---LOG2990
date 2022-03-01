import { HostListener, Injectable } from '@angular/core';
import { Letter } from '@app/classes/letter';
import { Vec2 } from '@app/classes/vec2';
import { GameContextService } from './game-context.service';
// TODO : Avoir un fichier séparé pour les constantes et ne pas les répéter!
export const DEFAULT_WIDTH = 500;
export const DEFAULT_HEIGHT = 500;
const CENTERTILE = 7;
const AJUSTY = 16;
const AJUSTTILEY = 10;
const AJUSTTILEX = 5;
const AJUSTSTARX = 4;
const AJUSTSTARY = 10;
const AJUSTBONUS = 10;
const AJUSTBONUSWORD = 5;
const AJUSTBONUSLETTER = 1;
const AJUSTLETTER = 4;
const TWOCHARNUMBER = 10;
const AJUSTSTEP = 0.5;
const EXCEPTIONX = 11;
const EXCEPTIONY = 0;
const AMOUNTOFNUMBER = 15;
const DEFAULT_SIZE = 9;
const TILE_SIZE = 30;
const BOARD_LENGTH = 15;
const COMMAND_X_INDEX = 1;
const COMMAND_Y_INDEX = 0;
const LOWERCASE_A_ASCII = 97;
const offset = BOARD_LENGTH / BOARD_LENGTH;
const squareSize = DEFAULT_WIDTH / BOARD_LENGTH - offset;
const gridOrigin = 20;

enum Colors {
    Mustard = '#E1AC01',
    Yellow = '#FFE454',
    Green = '#54bd9d',
    Blue = '#65CCD2',
    Grey = '#838383',
}

@Injectable({
    providedIn: 'root',
})
export class GridService {
    gridContext: CanvasRenderingContext2D;
    fontSize = '';
    multiplier = 1;
    buttonPressed = '';
    letters: string[] = [];
    private canvasSize: Vec2 = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };

    constructor(private gameContext: GameContextService) {}

    @HostListener('keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        this.buttonPressed = event.key;
    }

    drawGrid() {
        this.gridContext.clearRect(0, 0, 500, 500);
        this.gridContext.lineWidth = offset;
        this.gridContext.beginPath();
        this.drawWord('ABCDEFGHIJKLMNO');
        this.drawNumbers('1 2 3 4 5 6 7 8 9 10 11 12 13 14 15');

        this.gridContext.fillStyle = '#575757';
        this.gridContext.strokeStyle = '#000';
        for (let i = 0; i < BOARD_LENGTH; i++) {
            for (let j = 0; j < BOARD_LENGTH; j++) {
                this.gridContext.beginPath();
                this.gridContext.rect((squareSize + offset) * i + gridOrigin, (squareSize + offset) * j + gridOrigin, squareSize, squareSize);
                this.gridContext.fill();
                this.bonusConditions(i, j, (squareSize + offset) * i + gridOrigin, (squareSize + offset) * j + gridOrigin + AJUSTY);
                this.drawTiles(i, j, (squareSize + offset) * i + gridOrigin, (squareSize + offset) * j + gridOrigin + AJUSTY);
                this.gridContext.fillStyle = '#575757';
            }
        }
    }

    drawArrow(canvasX: number, canvasY: number, isHorizontal: boolean) {
        this.letters = [];
        const x = canvasX;
        const y = canvasY;
        this.drawGrid();
        this.gridContext.fillStyle = '#000';
        this.gridContext.beginPath();
        if (isHorizontal) {
            this.gridContext.moveTo(x, y);
            this.gridContext.lineTo(x - squareSize / 4, y + squareSize / 4);
            this.gridContext.lineTo(x - squareSize / 4, y - squareSize / 4);
            this.gridContext.fill();
        } else {
            this.gridContext.moveTo(x - squareSize / 4, y + squareSize / 4);
            this.gridContext.lineTo(x - squareSize / 2, y);
            this.gridContext.lineTo(x, y);
            this.gridContext.fill();
        }
    }

    drawTiles(posY: number, posX: number, canvasX: number, canvasY: number) {
        if (this.gameContext.state.value.board[posX][posY] !== undefined && this.gameContext.state.value.board[posX][posY] !== null) {
            const tile = this.gameContext.state.value.board[posX][posY] as Letter;
            this.gridContext.fillStyle = 'burlywood';
            this.gridContext.fill();
            this.drawMessage(tile.name, canvasX + AJUSTTILEX, canvasY + AJUSTTILEY, TILE_SIZE);
        }
    }

    drawTempTiles(letter: string, canvasX: number, canvasY: number) {
        this.gridContext.beginPath();
        this.gridContext.rect(
            (squareSize + offset) * Math.ceil(canvasX / (100 / 3) - 2) + gridOrigin,
            (squareSize + offset) * Math.ceil(canvasY / (100 / 3) - 2) + gridOrigin,
            squareSize,
            squareSize,
        );
        this.gridContext.fillStyle = 'burlywood';
        this.gridContext.fill();
        this.gridContext.lineWidth = 2.5;
        this.gridContext.strokeStyle = '#000';
        this.gridContext.stroke();
        this.drawMessage(letter, canvasX - squareSize * 0.7, canvasY + AJUSTTILEY, TILE_SIZE);
    }

    tempUpdateBoard(lettersToAdd: string, position: string) {
        const COMMAND_ORIENTATION_INDEX = position.length - 1;
        const verticalPosition = position.charCodeAt(COMMAND_Y_INDEX) - LOWERCASE_A_ASCII;
        const horizontalPositionString = position.substring(COMMAND_X_INDEX, COMMAND_ORIENTATION_INDEX);
        const horizontalPosition = parseInt(horizontalPositionString, 10) - 1;

        const isVerticalPlacement = position[COMMAND_ORIENTATION_INDEX] === 'v';

        const tempState = this.gameContext.state.value;
        const [dx, dy] = isVerticalPlacement ? [1, 0] : [0, 1];
        [...lettersToAdd].forEach((letter, i) => {
            const x = verticalPosition + dx * i;
            const y = horizontalPosition + dy * i;
            const tile = tempState.board[x][y];
            if (tile !== null) return;
            tempState.board[x][y] = {
                name: letter.toUpperCase(),
                score: 0,
            } as Letter;
        });
        this.gameContext.state.next(tempState);
    }

    bonusConditions(posX: number, posY: number, canvasX: number, canvasY: number) {
        const coord: string = posX.toString() + posY.toString();
        const tripleWord = ['00', '07', '014', '70', '714', '147', '140', '1414'];
        const tripleLetter = ['15', '19', '51', '55', '59', '513', '91', '95', '99', '913', '135', '139'];
        const doubleWord = ['11', '22', '33', '44', '1010', '1111', '1212', '1313', '113', '212', '311', '410', '131', '122', '113', '104'];
        const doubleLetter = [
            '03',
            '011',
            '30',
            '314',
            '37',
            '26',
            '28',
            '62',
            '66',
            '68',
            '612',
            '73',
            '711',
            '82',
            '86',
            '88',
            '812',
            '117',
            '1114',
            '126',
            '128',
            '143',
            '1411',
        ];
        if (tripleWord.includes(coord)) {
            this.drawBonus(canvasX, canvasY, Colors.Mustard, 'MOT x3');
        } else if (tripleLetter.includes(coord)) {
            this.drawBonus(canvasX, canvasY, Colors.Green, 'LETTRE x3');
        } else if (doubleWord.includes(coord)) {
            this.drawBonus(canvasX, canvasY, Colors.Yellow, 'MOT x2');
        } else if (doubleLetter.includes(coord) || (posX === EXCEPTIONX && posY === EXCEPTIONY)) {
            this.drawBonus(canvasX, canvasY, Colors.Blue, 'LETTRE x2');
        } else if (posX === CENTERTILE && posY === CENTERTILE) {
            this.drawBonus(canvasX - AJUSTSTARX, canvasY + AJUSTSTARY, Colors.Grey, '⭐');
        }
    }

    drawBonus(canvasX: number, canvasY: number, color: string, word: string) {
        this.gridContext.fillStyle = color;
        this.gridContext.fill();
        this.drawMessage(word, canvasX, canvasY, DEFAULT_SIZE);
    }

    drawMessage(word: string, posX: number, posY: number, size: number) {
        this.gridContext.fillStyle = '#000000';
        this.gridContext.font = word === '⭐' ? '30px system-ui' : this.multiplier * size + 'px system-ui';
        const sentence = word.split(' ');
        const step = 10;
        if (sentence.length === 2 && sentence[0] === 'MOT') {
            this.gridContext.fillText(sentence[0], posX + AJUSTBONUSWORD, posY);
            this.gridContext.fillText(sentence[1], posX + AJUSTBONUS, posY + step);
        } else if (sentence.length === 2 && sentence[0] === 'LETTRE') {
            this.gridContext.fillText(sentence[0], posX + AJUSTBONUSLETTER, posY);
            this.gridContext.fillText(sentence[1], posX + AJUSTBONUS, posY + step);
        } else {
            for (let i = 0; i < sentence.length; i++) {
                this.gridContext.fillText(sentence[i], posX, posY + step * i);
            }
        }
    }

    drawWord(word: string) {
        const startPosition: Vec2 = { x: -4, y: 40 };
        const step = 33.5;
        this.gridContext.font = '20px system-ui';
        for (let i = 0; i < word.length; i++) {
            this.gridContext.fillStyle = '#E1AC01';
            this.gridContext.fillText(word[i], startPosition.x + AJUSTLETTER, startPosition.y + step * i);
        }
    }

    drawNumbers(numbers: string) {
        const startPosition: Vec2 = { x: 28, y: 10 };
        const step = 33.5;
        this.gridContext.fillStyle = '#E1AC01';
        this.gridContext.font = '20px system-ui';
        const numberList = numbers.split(' ', AMOUNTOFNUMBER);

        for (let i = 0; i < numberList.length; i++) {
            const number: number = +numberList[i];
            if (number < TWOCHARNUMBER) {
                this.gridContext.fillText(number.toString(), startPosition.x + step * i, startPosition.y + AJUSTLETTER);
            } else {
                this.gridContext.fillText(number.toString(), startPosition.x + (step - AJUSTSTEP) * i, startPosition.y + AJUSTLETTER);
            }
        }
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }
}
