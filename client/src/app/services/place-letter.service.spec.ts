import { TestBed } from '@angular/core/testing';
import { GameState } from '@app/classes/game';
import { Letter } from '@app/classes/letter';
import { Rack } from '@app/classes/rack';
import { State } from '@app/classes/room';
import { Vec2 } from '@app/classes/vec2';
import { BehaviorSubject, of } from 'rxjs';
import { GameContextService, Tile } from './game-context.service';
import { GridService } from './grid.service';
import { MouseService } from './mouse.service';
import { PlaceLetterService } from './place-letter.service';

describe('PlaceLetterService', () => {
    let service: PlaceLetterService;
    let gameService: jasmine.SpyObj<GameContextService>;
    let gridService: jasmine.SpyObj<GridService>;
    let mouseService: jasmine.SpyObj<MouseService>;
    let rack: jasmine.SpyObj<Rack>;

    beforeEach(() => {
        rack = jasmine.createSpyObj('Rack', ['tempUpdate', 'addTemp', 'attemptTempUpdate'], { rack: new BehaviorSubject([{ name: 'A', score: 1 }]) });
        gameService = jasmine.createSpyObj('GameContextService', ['place', 'isMyTurn'], {
            state: new BehaviorSubject({
                state: State.Started,
                board: [
                    [null, { name: 'A', score: 1 }, null],
                    [null, null, null],
                    [null, null, null],
                ] as Tile[][],
            } as unknown as GameState),
            rack,
        });
        gameService.isMyTurn.and.callFake(() => of(true));
        gridService = jasmine.createSpyObj('GridService', ['drawGrid', 'tempUpdateBoard', 'drawArrow'], {
            rack: [{ name: 'A', score: 1 }] as Letter[],
            letterPosition: [{ x: 0, y: 0 }] as Vec2[],
            firstLetter: [0, 0] as number[],
            letters: [{ name: 'A', score: 1 }] as Letter[],
            letterForServer: 'a',
        });
        mouseService = jasmine.createSpyObj('MouseService', ['MouseHitDetect'], { mousePosition: { x: 20, y: 510 }, isHorizontal: true });
    });

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: GameContextService, useValue: gameService },
                { provide: GridService, useValue: gridService },
                { provide: MouseService, useValue: mouseService },
            ],
        }).compileComponents();
        service = TestBed.inject(PlaceLetterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('send placed letters to the server or remove the word from the board should clear all the variable', () => {
        const clearSpy = spyOn(service, 'clear');
        service.sendPlacedLetters();
        service.removeWord();
        expect(clearSpy).toHaveBeenCalled();
    });
    it('removedLetterOnCanvas should clear redraw an arrow a the right place', () => {
        const arrowSpy = spyOn(service, 'drawShiftedArrow');
        service.removeLetterOnCanvas();
        expect(arrowSpy).toHaveBeenCalled();
    });
    it('placeWordOnCanvas should update the rack', () => {
        service.placeWordOnCanvas('a');
        expect(gameService.rack.tempUpdate).toHaveBeenCalled();
    });

    it('clearing the variable should redraw the board', () => {
        service.clear();
        expect(gridService.drawGrid).toHaveBeenCalled();
    });
});
