import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ALPHABET } from '@app/alphabet-letters';
import { MessageType } from '@app/classes/chat-log';
import { Letter } from '@app/classes/letter';
import { ChatBoxLogicService } from './chat-box-logic.service';

describe('ChatBoxLogicService', () => {
    let service: ChatBoxLogicService;
    const placeCommands = ['!placer g9h baf', '!placer g9h abc', '!placer g13h def', '!placer g13v a', '!placer g13 g'];
    const invalidPlaceCommands = ['!placer gz adant', '!placer g9h adan*', '!placer g16h s', '!placer g13v ', '!placer g13 5'];
    const exchangeCommands = ['!échanger ab', '!échanger e', ' !échanger cdg'];
    const invalidExchangeCommands = ['!échanger', '!échanger eT', ' !échanger e23', '!échanger e*'];

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [{ provide: Router, useValue: {} }],
        });
        service = TestBed.inject(ChatBoxLogicService);
        service.gameContextService.state.next({ ...service.gameContextService.state.value, turn: service.gameContextService.myId });
    });
    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('validateCommand should call placer for a list of valid !placer commands ', async () => {
        const place = spyOn(service, 'place' as never);
        for (const i of placeCommands) {
            await service.validateSyntax(i);
            expect(place).toHaveBeenCalled();
        }
    });

    it('placer should call communicationService.placer() for a list of valid !placer commands', async () => {
        const comPlace = spyOn(service.gameContextService, 'place');
        const rackStub: Letter[] = [];
        const RACKS_LENGTH = 7;
        for (let i = 0; i < RACKS_LENGTH; i++) {
            rackStub.push(ALPHABET[i]); // adds 'abcdefg'
        }
        service.gameContextService.rack.rack.next(rackStub);
        for (const i of placeCommands) {
            await service.validateSyntax(i);
            expect(comPlace).toHaveBeenCalled();
        }
    });

    it('validateSyntax should call communicationService.sendLocalMessage for a list of invalid !placer commands ', async () => {
        const sendLocalMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        for (const i of invalidPlaceCommands) {
            await service.validateSyntax(i);
            expect(sendLocalMessage).toHaveBeenCalledWith('Ces lettres ne sont pas dans le chevalet.', MessageType.Local);
        }
    });

    it('validateCommand should call echanger for a list of valid !echanger commands ', async () => {
        const exchange = spyOn(service, 'exchange' as never);
        for (const i of exchangeCommands) {
            await service.validateSyntax(i);
            expect(exchange).toHaveBeenCalled();
        }
    });

    it('placer should call communicationService.echanger() for a list of valid !echanger commands', async () => {
        const comExchange = spyOn(service.gameContextService, 'executeCommand');
        const rackStub: Letter[] = [];
        const RACKS_LENGTH = 7;
        for (let i = 0; i < RACKS_LENGTH; i++) {
            rackStub.push(ALPHABET[i]); // adds 'abcdefg'
        }
        service.gameContextService.rack.rack.next(rackStub);
        for (const i of exchangeCommands) {
            await service.validateSyntax(i);
            expect(comExchange).toHaveBeenCalled();
        }
    });

    it('validateSyntax should call communicationService.sendLocalMessage for a list of invalid !echanger commands ', async () => {
        const sendLocalMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        for (const i of invalidExchangeCommands) {
            await service.validateSyntax(i);
            expect(sendLocalMessage).toHaveBeenCalledWith('La commande !échanger ne respecte pas la syntaxe demandée', MessageType.Local);
        }
    });

    it('validateCommand should call pass when !passer command is sent ', async () => {
        const pass = spyOn(service, 'pass' as never).and.callThrough();
        await service.validateSyntax('!passer');
        expect(pass).toHaveBeenCalled();
    });

    it('pass should call communicationService.switchTurn() for a valid !passer command', async () => {
        const switchTurn = spyOn(service.gameContextService, 'executeCommand');
        await service.validateSyntax('!passer');
        expect(switchTurn).toHaveBeenCalled();
    });

    it('validateSyntax should call communicationService.sendLocalMessage for a list of invalid !passer commands ', async () => {
        const sendLocalMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        for (const i of ['!passer 5', '!passer a', '!passer A', '!passer *']) {
            await service.validateSyntax(i);
            expect(sendLocalMessage).toHaveBeenCalledWith('La commande !passer ne respecte pas la syntaxe demandée', MessageType.Local);
        }
    });

    it('validateSyntax should call communicationService.sendMessage for a list of commands not starting with !', async () => {
        const sendMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        for (const i of ['passer', 'placer g14v ab', 'echanger aw', 'aide']) {
            await service.validateSyntax(i);
            expect(sendMessage).toHaveBeenCalledWith('passer');
        }
    });
    it('validateSyntax should not call communicationService.sendMessage for an empty message', async () => {
        const sendMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        await service.validateSyntax('');
        expect(sendMessage).not.toHaveBeenCalled();
    });
    it('validateSyntax should not call communicationService.sendLocalMessage for the accepted characters', async () => {
        const sendLocalMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        const invalidText = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        await service.validateSyntax(invalidText);
        expect(sendLocalMessage).toHaveBeenCalledOnceWith('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    });
    it('validateSyntax should call communicationService.sendCommandMessage for the !aide command', async () => {
        const sendLocalMessage = spyOn(service.gameContextService.chatLog, 'addMessage');
        await service.validateSyntax('!aide');
        expect(sendLocalMessage).toHaveBeenCalled();
    });
    it('validateSyntax should not call help for an invalid !aide command', async () => {
        const help = spyOn(service, 'sendHelp' as never).and.callThrough();
        await service.validateSyntax('!aide v');
        expect(help).not.toHaveBeenCalled();
    });

    it('validateSyntax should call getReserve for a invalid !réserve command', async () => {
        const reserve = spyOn(service, 'getReserve' as never).and.callThrough();
        await service.validateSyntax('!réserve');
        expect(reserve).toHaveBeenCalled();
    });
});
