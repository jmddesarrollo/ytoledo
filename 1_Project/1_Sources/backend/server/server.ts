import express from 'express';
import http from 'http';

// Router
import { AuthRoutes } from '../routes/ws/auth.route';
import { EmailRoutes } from '../routes/ws/email.route';
import { FileRoutes } from '../routes/ws/file.route';
import { PermissionRoutes } from '../routes/ws/permission.route';
import { RoleRoutes } from '../routes/ws/role.route';
import { RouteRoutes } from '../routes/ws/route.route';
import { UserRoutes } from '../routes/ws/user.route';

// HTTP Routes
import { RouteController } from '../controllers/ws/route.controller';

const path = require('path');

/**
 * Clase del Servidor. 
 * Default: Exportación única
 */
export default class Server {
    private static _instance: Server;

    public app: express.Application;
    public port: number;
    public url: string;

    // Configuración de la conexión de los sockets
    // Encargado de los eventos en los sockets: Escucha y emite
    public io: any;
    // Io necesita la configuración del servidor sobre el que va a correr
    // Pero Express e IO no son compatibles así que necesitan a un servidor intermediario: http
    private httpServer: http.Server;

    // private: Patrón Singleton para que el Server sea instanciado una única vez
    // y evitar otras instancias accidentales en la aplicación
    private constructor() {
        this.app = express();
        this.port = Number(process.env.YTO_SERVER_PORT);
        this.url = process.env.YTO_SERVER_URL || '0.0.0.0';

        this.httpServer = new http.Server(this.app);

        // Conexión Socket como Servidor
        this.io = require("socket.io")(this.httpServer, { path: "/" + process.env.YTO_SERVICE_NAME });

        this.configureHttpRoutes();
        this.listenSockets();

        this.app.use(express.static(path.resolve(__dirname, '../public')));
        this.app.use('*', express.static(path.resolve(__dirname, '../public/index.html')));
    }

    // Patrón Singleton para devolver la instancia si no ha sido creada, sino devuelve la ya creada
    // static: método que puede ser llamado directamente haciendo referencia a la clase
    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    private configureHttpRoutes() {
        const routeController = new RouteController();
        
        // HTTP endpoint for file downloads
        this.app.get('/api/routes/:fileTrack/download', (req, res) => {
            routeController.downloadAttachedFile(req, res);
        });
    }

    private listenSockets() {
        console.log('*********');
        console.log('ENTORNO: ' + process.env.YTO_NODE_ENV);
        console.log('PUERTO: ' + process.env.YTO_SERVER_PORT);
        console.log('VERSION NODE: ' + process.version);
        console.log('*********');
        console.log('Escuchando conexiones');

        this.io.on('connect', (socket: any) => {
            console.log('Cliente conectado v2: ' + socket.id);
                  
            AuthRoutes(socket); 
            EmailRoutes(socket);
            FileRoutes(socket);
            PermissionRoutes(socket);
            RoleRoutes(socket);
            RouteRoutes(socket);
            UserRoutes(socket);

            socket.on('disconnect', () => {
                console.log('Cliente desconectado v2: ' + socket.id);
            });
        });
    }

    public start(callback: any) {
        this.httpServer.listen(this.port, process.env.YTO_SERVER_URL, callback);
    }
}