import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { Letter } from '@app/classes/letter';
import { CommunicationService } from '@app/services/communication.service';
import { GameContextService } from '@app/services/game-context.service';
import { GridService } from '@app/services/grid.service';

const MAX_LETTERS = 7;
@Component({
    selector: 'app-letter-rack',
    templateUrl: './letter-rack.component.html',
    styleUrls: ['./letter-rack.component.scss'],
})
export class LetterRackComponent implements OnInit, AfterViewInit {
    letters: Letter[];
    timeOut: number;
    selectedLetters: string = '';
    constructor(
        public communicationService: CommunicationService,
        public gameContextService: GameContextService,
        public gridService: GridService,
        private elementRef: ElementRef,
    ) {
        this.gameContextService.state.subscribe(() => {
            return;
        });
    }

    ngOnInit(): void {
        this.gameContextService.rack.subscribe((newRack) => {
            this.letters = newRack;
        });
    }

    ngAfterViewInit() {
        this.elementRef.nativeElement.querySelector('#letter-container')?.addEventListener('contextmenu', this.menu.bind(this));
    }
    hideMenu() {
        const menu = document.getElementById('menu') as HTMLElement;
        menu.style.display = 'none';
    }

    menu(event: Event): void {
        event.preventDefault();
        const menu = document.getElementById('menu') as HTMLElement;
        const letter = event.target as HTMLElement;
        letter.parentElement?.parentElement?.parentElement?.focus();

        if (letter.parentElement?.parentElement?.id === 'selected') {
            letter.parentElement?.parentElement?.removeAttribute('id');
        } else {
            menu.style.display = 'block';
            letter.parentElement?.parentElement?.setAttribute('id', 'selected');
        }

        this.checkSelection();
    }

    clearSelection(command: string) {
        const container = document.getElementsByClassName('letter-container');
        Array.from(container).forEach((letters) => {
            if (command === 'exchange' && letters.id === 'selected') {
                letters.removeAttribute('id');
            } else if (command === 'manipulate' && letters.id === 'manipulating') {
                letters.removeAttribute('id');
            }
        });
        if (command === 'exchange') this.hideMenu();
    }

    checkSelection() {
        let itemSelected = false;
        window.addEventListener('click', (e) => {
            const selection = e.target as HTMLElement;
            const parentPossibilities = [
                'name',
                'letter-name',
                'letter-container',
                'rack-container',
                'rackArea',
                'context-menu',
                'app-letter-rack',
                'letter-score',
                'score',
            ];
            const name = selection?.getAttribute('class') as string;

            if (!parentPossibilities.includes(name)) {
                this.clearSelection('exchange');
                this.clearSelection('manipulate');
            }
        });

        const container = document.getElementsByClassName('letter-container');
        Array.from(container).forEach((letters) => {
            if (letters.id === 'selected') {
                itemSelected = true;
            }
        });

        if (!itemSelected) this.hideMenu();
    }

    exchange() {
        this.getSelectedLetters();
        this.communicationService.exchange(this.selectedLetters);
        this.selectedLetters = '';
    }
    /*
    @HostListener('keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        this.buttonPressed = event.key;
        if (this.buttonPressed === 'Enter') {
            this.gridService.letters = [];
            this.gridService.drawGrid();
        } else if (this.buttonPressed === 'Backspace') {
            const letter = this.gridService.letters.pop();
            if (letter !== undefined) {
                this.gridService.rack.push(letter);
                this.gameContextService.addTempRack(letter);
            }
            this.gameContextService.tempUpdateRack();
            this.gridService.drawGrid();
            for (let i = 0; i < this.gridService.letters.length; i++) {
                this.drawRightDirection(this.gridService.letters[i].name.toLowerCase(), i, this.mouseDetectService.isHorizontal);
            }
        } else if (this.mouseDetectService.writingAllowed && this.isInBound()) {
            try {
                this.gameContextService.attemptTempRackUpdate(this.buttonPressed);
                this.drawRightDirection(this.buttonPressed, this.gridService.letters.length, this.mouseDetectService.isHorizontal);
                for (const i of this.gridService.rack) {
                    if (i.name === this.buttonPressed.toUpperCase()) {
                        this.gridService.letters.push(i);
                        break;
                    }
                }
                this.gameContextService.tempUpdateRack();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                this.communicationservice.sendLocalMessage(e.message);
            }
        }
    }
    */
    manipulate(event: Event): void {
        const tile = event.target as HTMLElement;
        if (tile.parentElement?.parentElement?.getAttribute('id') === 'selected') {
            return;
        }
        this.clearSelection('manipulate');
        console.log(tile);
        tile.parentElement?.parentElement?.setAttribute('id', 'manipulating');
        this.checkSelection();
    }

    getSelectedLetters() {
        const container = document.getElementsByClassName('letter-container');
        Array.from(container).forEach((letters) => {
            const letterList = letters as HTMLElement;
            if (letters.id === 'selected') {
                this.selectedLetters += letterList.innerText[0].toLowerCase();
            }
        });
    }

    getReserveCount(): boolean {
        return this.gameContextService.state.value.reserveCount < MAX_LETTERS ? true : false;
    }
}
