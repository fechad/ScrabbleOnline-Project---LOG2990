import { Application } from '@app/app';
import * as constants from '@app/constants';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { SocketManager } from './controllers/socket.controller';
import { DictionnaryService } from './services/dictionnary.service';
import { GameHistoryService } from './services/game-history-service';
import { LoginsService } from './services/logins.service';
import { RoomsService } from './services/rooms.service';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    private server: http.Server;
    private socketManager: SocketManager;

    constructor(
        private readonly application: Application,
        private readonly roomsService: RoomsService,
        private readonly logins: LoginsService,
        private readonly dictionnnaryService: DictionnaryService,
        private readonly gameHistoryService: GameHistoryService,
    ) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, constants.DECIMAL_BASE) : val;
        if (isNaN(port)) return val;
        return port >= 0 ? port : false;
    }
    async init(): Promise<void> {
        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);

        await this.dictionnnaryService.init();
        this.socketManager = new SocketManager(this.server, this.roomsService, this.logins, this.dictionnnaryService, this.gameHistoryService);
        this.socketManager.init();

        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
