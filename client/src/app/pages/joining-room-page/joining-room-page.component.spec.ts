import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Parameters } from '@app/classes/parameters';
import { Room, State } from '@app/classes/room';
import { CommunicationService } from '@app/services/communication.service';
import { CommunicationServiceMock } from '@app/services/communication.service.spec';
import { JoiningRoomPageComponent } from './joining-room-page.component';

const dialogMock = {
    open: () => {
        return;
    },
};

const data = {
    room: 1,
    name: 'test',
    dictionary: 'francais',
};
describe('JoiningRoomPageComponent', () => {
    let component: JoiningRoomPageComponent;
    let fixture: ComponentFixture<JoiningRoomPageComponent>;
    let service: CommunicationServiceMock;

    beforeEach(async () => {
        service = new CommunicationServiceMock();
        await TestBed.configureTestingModule({
            declarations: [JoiningRoomPageComponent],
            imports: [MatCardModule],
            providers: [
                { provide: CommunicationService, useValue: service },
                { provide: ActivatedRoute, useValue: { snapshot: { url: ['joining-room'] } } },
                { provide: MatDialog, useValue: dialogMock },
                { provide: MAT_DIALOG_DATA, useValue: data },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoiningRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('openDialog should open dialog from component', () => {
        const testRoom: Room = {
            id: 0,
            name: 'Room',
            parameters: new Parameters(),
            mainPlayer: { avatar: 'a', name: 'Player 1', id: '0', connected: true, virtual: false },
            otherPlayer: undefined,
            state: State.Setup,
        };
        const openDialogSpy = spyOn(component.dialog, 'open');
        component.openDialog(testRoom);
        expect(openDialogSpy).toHaveBeenCalled();
    });
    it('getRandomRoom should call openDialog', () => {
        const testRoom: Room = {
            id: 0,
            name: 'Room',
            parameters: new Parameters(),
            mainPlayer: { avatar: 'a', name: 'Player 1', id: '0', connected: true, virtual: false },
            otherPlayer: undefined,
            state: State.Setup,
        };
        component.rooms[0] = testRoom;
        const openDialogSpy = spyOn(component, 'openDialog');
        component.getRandomRoom();
        expect(openDialogSpy).toHaveBeenCalled();
    });
});
