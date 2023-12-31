// eslint-disable-next-line max-classes-per-file
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ChatLog } from '@app/classes/chat-log';
import { GameState } from '@app/classes/game';
import { Message } from '@app/classes/message';
import { Rack } from '@app/classes/rack';
import { State } from '@app/classes/room';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { LetterRackComponent } from '@app/components/letter-rack/letter-rack.component';
import { routes } from '@app/modules/app-routing.module';
import { CommunicationService } from '@app/services/communication.service';
import { CommunicationServiceMock } from '@app/services/communication.service.spec';
import { GameContextService } from '@app/services/game-context.service';
import { GridService } from '@app/services/grid.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BehaviorSubject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { GamePageComponent } from './game-page.component';

const dialogMock = {
    close: () => {
        return;
    },
};
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let communicationService: CommunicationServiceMock;
    let gameContext: jasmine.SpyObj<GameContextService>;
    let rack: jasmine.SpyObj<Rack>;
    let chatLog: jasmine.SpyObj<ChatLog>;

    beforeEach(async () => {
        communicationService = new CommunicationServiceMock();
        rack = jasmine.createSpyObj('Rack', ['tempUpdate', 'addTemp', 'attemptTempUpdate'], { rack: new BehaviorSubject([{ name: 'A', score: 1 }]) });
        chatLog = jasmine.createSpyObj('ChatLog', ['addMessages'], { messages: new BehaviorSubject([] as Message[]) });
        gameContext = jasmine.createSpyObj('GameContextService', ['isMyTurn', 'isEnded', 'subscribe', 'switchTurn', 'executeCommand'], {
            state: new BehaviorSubject({
                players: [
                    { id: '0', avatar: 'a', name: 'P1', connected: true, virtual: false },
                    { id: '1', avatar: 'a', name: 'P2', connected: true, virtual: false },
                ].map((info) => ({ info, score: 0, rackCount: 7 })),
                reserveCount: 88,
                board: [],
                turn: undefined,
                state: State.Started,
            } as GameState),
            rack,
            chatLog,
            objectives: new BehaviorSubject(undefined),
        });
        gameContext.isMyTurn.and.callFake(() => of(true));

        await TestBed.configureTestingModule({
            declarations: [GamePageComponent, ChatBoxComponent, LetterRackComponent],
            schemas: [NO_ERRORS_SCHEMA],
            imports: [
                RouterTestingModule.withRoutes(routes),
                HttpClientTestingModule,
                FontAwesomeModule,
                MatCardModule,
                MatToolbarModule,
                MatIconModule,
                FormsModule,
            ],
            providers: [
                { provide: MatDialog, useValue: dialogMock },
                { provide: GridService, usevalue: {} },
                { provide: CommunicationService, useValue: communicationService },
                { provide: GameContextService, useValue: gameContext },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(GamePageComponent);
        const router = TestBed.inject(Router);
        router.initialNavigation();
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call openConfirmation() when quit-game button clicked ', fakeAsync(() => {
        const forfeitGameSpy = spyOn(component, 'quitGame').and.callThrough();
        const button = fixture.debugElement.query(By.css('#quit-game'));
        button.nativeElement.click();
        tick();
        expect(forfeitGameSpy).toHaveBeenCalled();
        flush();
    }));

    it('should call fire a swal alert when quit-game button clicked ', () => {
        const swalSpy = spyOn(Swal, 'fire').and.callThrough();
        component.quitGame();
        expect(swalSpy).toHaveBeenCalled();
    });

    it('should switch turn if skipTurn() is called', () => {
        component.skipMyTurn();
        expect(component.gameContextService.executeCommand).toHaveBeenCalled();
    });

    it('click on reducing font size of board should call changeSize()', fakeAsync(() => {
        const reduceFontSpy = spyOn(component, 'changeSize');
        const button = fixture.debugElement.query(By.css('#reduce'));
        button.nativeElement.click();
        tick();
        expect(reduceFontSpy).toHaveBeenCalled();
    }));

    it('click on reset font size of board should call changeSize()', fakeAsync(() => {
        const resetFontSpy = spyOn(component, 'changeSize');
        const button = fixture.debugElement.query(By.css('#reset'));
        button.nativeElement.click();
        tick();
        expect(resetFontSpy).toHaveBeenCalled();
    }));

    it('click on increasing font size of board should call changeSize()', fakeAsync(() => {
        const increaseFontSpy = spyOn(component, 'changeSize');
        const button = fixture.debugElement.query(By.css('#increase'));
        button.nativeElement.click();
        tick();
        expect(increaseFontSpy).toHaveBeenCalled();
    }));

    it('send should call send in service', () => {
        const nextSpy = spyOn(component.sent, 'next').and.callThrough();
        component.send();
        expect(nextSpy).toHaveBeenCalled();
    });

    it('should confirmForfeit if confirmed alert and state is started', fakeAsync(() => {
        const forfeitSpy = spyOn(component.communicationService, 'confirmForfeit').and.callThrough();

        component.quitGame();
        Swal.clickConfirm();
        tick();
        expect(forfeitSpy).toHaveBeenCalled();
        flush();
    }));

    it('should leave if state is aborted', fakeAsync(() => {
        const leaveSpy = spyOn(component.communicationService, 'leave').and.callThrough();

        gameContext.state.next({ ...gameContext.state.value, state: State.Aborted });
        component.quitGame();
        Swal.clickConfirm();
        tick();
        expect(leaveSpy).toHaveBeenCalled();
        flush();
    }));

    it('should saveScore if state is aborted', fakeAsync(() => {
        const scoreSpy = spyOn(component.communicationService, 'saveScore');

        gameContext.state.next({ ...gameContext.state.value, state: State.Ended });
        tick();
        expect(scoreSpy).toHaveBeenCalled();
        flush();
    }));

    it('should show objectives', () => {
        component.showObjective(true);
        expect(component.publicObjectivesShown).toEqual(false);
        expect(component.privateObjectivesShown).toEqual(true);
    });

    it('should not show objectives', () => {
        component.showObjective(false);
        expect(component.publicObjectivesShown).toEqual(true);
        expect(component.privateObjectivesShown).toEqual(false);
    });
});
