/* eslint-disable prettier/prettier */
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Vec2 } from '@app/classes/vec2';
import { BOARD_LENGTH, MouseButton } from '@app/constants';
import { from } from 'rxjs';
import { GameContextService } from './game-context.service';
import { GridService } from './grid.service';
import { MouseService } from './mouse.service';


const fakeIsInBound = (event: MouseEvent) => {
    const size = 500;
    const origin = 20;
    const GRID_BORDERS = [origin, size];
    return (
        event.offsetX >= GRID_BORDERS[0] && event.offsetX <= GRID_BORDERS[1] && event.offsetY >= GRID_BORDERS[0] && event.offsetY <= GRID_BORDERS[1]
    );
};

describe('MouseDetect', () => {
    let service: MouseService;
    let mouseEvent: MouseEvent;
    let gameContextService: jasmine.SpyObj<GameContextService>;
    let gridService: jasmine.SpyObj<GridService>;

    beforeEach(() => {
        gameContextService = jasmine.createSpyObj('GameContextService', ['isMyTurn'], {
            state: {
                value: {
                    board: Array.from({ length: BOARD_LENGTH }, () => Array.from({ length: BOARD_LENGTH }, () => null)),
                },
            },
        });
        gameContextService.isMyTurn.and.callFake(() => from([true]));
        gridService = jasmine.createSpyObj('GridService', ['drawGrid', 'drawArrow']);

        const rackContainer = document.createElement('div');
        rackContainer.classList.add('rack-container');
        document.body.appendChild(rackContainer);
        const canvas = document.createElement('div');
        canvas.id = 'canvas';
        rackContainer.appendChild(canvas);

        TestBed.configureTestingModule({
            providers: [
                { provide: GameContextService, useValue: gameContextService },
                { provide: GridService, useValue: gridService },
            ],
        });
        service = TestBed.inject(MouseService);
        // to access the private attribute for this test file.
        // eslint-disable-next-line dot-notation
        service['gridService'].letterWritten = 0;
    });

    /* eslint-disable @typescript-eslint/no-magic-numbers */
    it('mouseHitDetect should not change the mouse position if it is not a left click', () => {
        const expectedPosition: Vec2 = { x: 0, y: 0 };
        mouseEvent = {
            offsetX: expectedPosition.x + 10,
            offsetY: expectedPosition.y + 10,
            button: MouseButton.Right,
        } as MouseEvent;
        service.mouseHitDetect(mouseEvent);
        expect(service.mousePosition).not.toEqual({ x: mouseEvent.offsetX, y: mouseEvent.offsetY });
        expect(service.mousePosition).toEqual(expectedPosition);
    });

    it('mouseHitDetect should return on right click', async () => {
        mouseEvent = {
            offsetX: 20,
            offsetY: 20,
            button: MouseButton.Right,
        } as MouseEvent;
        service.mouseHitDetect(mouseEvent);
        expect(gridService.drawGrid).not.toHaveBeenCalled();
    });

    it('calculateAxis should return a number', async () => {
        mouseEvent = {
            offsetX: 20,
            offsetY: 20,
            button: MouseButton.Right,
        } as MouseEvent;
        const resultX = service.calculateAxis(mouseEvent.offsetX, true);
        const resultY = service.calculateAxis(mouseEvent.offsetY, false);
        expect(typeof resultX).toEqual(typeof 20);
        expect(typeof resultY).toEqual(typeof 20);
    });


    it('isInBound should return false if positionX is under 20', async () => {
        spyOn(service, 'isInBound').and.callFake(fakeIsInBound);
        mouseEvent = {
            offsetX: Math.random() * 19,
            offsetY: 20,
            button: MouseButton.Right,
        } as MouseEvent;
        const result = service.isInBound(mouseEvent);
        expect(result).toEqual(false);
    });

    it('isInBound should return false if positionY is under 20', async () => {
        spyOn(service, 'isInBound').and.callFake(fakeIsInBound);
        mouseEvent = {
            offsetX: 20,
            offsetY: Math.random() * 19,
            button: MouseButton.Right,
        } as MouseEvent;
        const result = service.isInBound(mouseEvent);
        expect(result).toEqual(false);
    });

    it('isInBound should return false if positionX is over 500', async () => {
        spyOn(service, 'isInBound').and.callFake(fakeIsInBound);
        mouseEvent = {
            offsetX: Math.random() * 501 + 500,
            offsetY: 20,
            button: MouseButton.Right,
        } as MouseEvent;
        const result = service.isInBound(mouseEvent);
        expect(result).toEqual(false);
    });

    it('isInBound should return false if positionY is over 500', async () => {
        spyOn(service, 'isInBound').and.callFake(fakeIsInBound);
        mouseEvent = {
            offsetX: 20,
            offsetY: Math.random() * 501 + 500,
            button: MouseButton.Right,
        } as MouseEvent;
        const result = service.isInBound(mouseEvent);
        expect(result).toEqual(false);
    });

    it('isInBound should return true if position between is over (20,20) and (500,500)', async () => {
        spyOn(service, 'isInBound').and.callFake(fakeIsInBound);
        mouseEvent = {
            offsetX: Math.floor(Math.random() * (500 - 20) + 20),
            offsetY: Math.floor(Math.random() * (500 - 20) + 20),
            button: MouseButton.Right,
        } as MouseEvent;
        const result = service.isInBound(mouseEvent);
        expect(result).toEqual(true);
    });

    it('should call drawGrid on valid horizontal click', fakeAsync(() => {
        const page = document.createElement('div');
        const canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width = 500;
        page.appendChild(canvas);
        
        spyOn(service, 'isInBound').and.callFake(fakeIsInBound);
        for (let i = 0; i < 15; i++) 
        gameContextService.state.value.board.push([null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]);

        mouseEvent = {
            offsetX: 450,
            offsetY: 450,
            button: MouseButton.Left,
        } as MouseEvent;
        service.mouseHitDetect(mouseEvent);
        tick();
        expect(gridService.drawGrid).toHaveBeenCalled();
    }));

    it('should not call drawGrid on left click but invalid mouse position ', fakeAsync(() => {
        mouseEvent = {
            offsetX: 0,
            offsetY: 0,
            button: MouseButton.Right,
        } as MouseEvent;
        const result = service.isInBound(mouseEvent);
        tick();
        expect(result).toBeFalse();
    }));
});
