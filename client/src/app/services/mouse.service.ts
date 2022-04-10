import { Injectable } from '@angular/core';
import { Vec2 } from '@app/classes/vec2';
import * as cst from '@app/constants';
import { take } from 'rxjs/operators';
import { GameContextService } from './game-context.service';
import { GridService } from './grid.service';
/* eslint-disable  @typescript-eslint/no-non-null-assertion */
@Injectable({
    providedIn: 'root',
})
export class MouseService {
    mousePosition: Vec2 = { x: 0, y: 0 };
    isHorizontal = true;
    constructor(private gridService: GridService, public gameContextService: GameContextService) {}

    async mouseHitDetect(event: MouseEvent) {
        const board = this.gameContextService.state.value.board;
        const myTurn = await this.gameContextService.isMyTurn().pipe(take(1)).toPromise();
        if (!myTurn) return;
        if (this.gridService.letterWritten !== 0) return;
        if (event.button !== cst.MouseButton.Left || !this.isInBound(event)) return;

        const prevPos = this.mousePosition;
        this.mousePosition = {
            x: this.calculateAxis(event.offsetX, true),
            y: this.calculateAxis(event.offsetY, false),
        };
        const y = Math.ceil(this.mousePosition.y / cst.SQUARE_SIZE) - cst.ADJUSTMENT;
        const x = Math.ceil(this.mousePosition.x / cst.SQUARE_SIZE) - cst.ADJUSTMENT;
        if (board[y][x]) return;
        this.isHorizontal = !this.areEqual(prevPos, this.mousePosition) || !this.isHorizontal;
        this.gridService.drawGrid();
        this.gridService.drawArrow(this.mousePosition.x, this.mousePosition.y, this.isHorizontal);
    }

    isInBound(event: MouseEvent): boolean {
        const size = document.getElementById('canvas')?.clientWidth;
        const GRID_BORDERS = [cst.GRID_ORIGIN, size];
        return (
            event.offsetX >= GRID_BORDERS[0]?.valueOf()! &&
            event.offsetX <= GRID_BORDERS[1]?.valueOf()! &&
            event.offsetY >= GRID_BORDERS[0]?.valueOf()! &&
            event.offsetY <= GRID_BORDERS[1]?.valueOf()!
        );
    }
    calculateAxis(position: number, isHorizontal: boolean): number {
        const size = document.getElementById('canvas')?.clientWidth;
        let sqrSize = cst.DEFAULT_SIZE / cst.NUMBER_OF_TILES;
        if (!isHorizontal) sqrSize -= cst.OFFSET;
        const converted = (position * cst.DEFAULT_SIZE) / size?.valueOf()!;
        let axis = Math.floor((converted - cst.GRID_ORIGIN) / cst.TILE);
        if (axis < 0) axis = 0;
        return (sqrSize + cst.OFFSET) * axis + cst.GRID_ORIGIN + cst.CANVAS_ADJUSTMENT;
    }

    areEqual(vecA: Vec2, vecB: Vec2) {
        return vecA.x === vecB.x && vecA.y === vecB.y;
    }
}
