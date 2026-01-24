import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';

import { RouteService } from '../../services/route';
import { FileData } from '../../models/file-attachment.model';

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];

const sequelize = require('../../models').sequelize;

export class RouteController {
    private routeService = new RouteService();
    private AuthorizedMiddleware = new AuthorizedMiddleware();

    private permissionType: string;
    private mode: string;

    constructor(){
        this.permissionType = config.permission_routes_manager;
        this.mode = 'reading';
    }

    public async getRoutes(req: any, socket: Socket ) {
        try {
            // Extraer filtros de la request
            const filters = req.filters || {};
            
            const data = await this.routeService.getRoutes(filters);
            
            socket.emit("route/getRoutes", { data, message: 'Las rutas se han consultado correctamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }
      
    public async getRoute(req: any, socket: Socket ) {
        const routeId = req.routeId;
        
        try {
            const data = await this.routeService.getRoute(routeId);
            
            socket.emit("route/getRoute", { data, message: 'La ruta se ha consultado correctamente' });
        } catch(error) {
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

    public async getNextRoute(req: any, socket: Socket ) {
        try {
            console.log('RouteController - getNextRoute');
            const data = await this.routeService.getNextRoute();

            console.log('RouteController - getNextRoute - data', data);
            
            if (data) {
                socket.emit("route/getNextRoute", { data, message: 'La próxima ruta se ha consultado correctamente' });
            } else {
                socket.emit("route/getNextRoute", { data: null, message: 'No hay rutas programadas próximamente' });
            }
        } catch(error) {
            console.error('Error en getNextRoute:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado al obtener la próxima ruta" });
            }
        }
    }
 
    public async addRoute(req: any, socket: Socket) {
        const route = req.route;
        const fileData: FileData | undefined = req.fileData;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);
            
            // Obtener el user_id del token decodificado (está en tokenDecoded.user.id)
            const userId = tokenDecoded.user.id;
            
            const data = await this.routeService.addRoute(route, t, userId, fileData);
    
            t.commit();
    
            socket.emit("route/addRoute", { data, message: 'La ruta se ha registrado correctamente' });
            socket.broadcast.emit('route/addRoute', { data });
        } catch(error) {
            t.rollback();

            console.error('RouteController.addRoute - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                console.error('Error no controlado en addRoute:', error);
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }
       
    public async editRoute(req: any, socket: Socket) {
        const route = req.route;
        const fileData: FileData | undefined = req.fileData;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            const routePrev = await this.routeService.getRoute(route.id);

            const data = await this.routeService.editRoute(route, t, fileData);
    
            t.commit();
    
            socket.emit("route/editRoute", { data, routePrev, message: 'La ruta se ha editado correctamente' });
            socket.broadcast.emit('route/editRoute', { data });
        } catch(error) {
            t.rollback();

            console.error('RouteController.editRoute - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }
     
    public async deleteRoute(req: any, socket: Socket) {
        const route = req.route;
        const routeId = route.id;

        // Iniciar transacción
        let t = await sequelize.transaction(); 

        try {
            this.mode = 'writing';

            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);           

            await this.routeService.deleteRoute(routeId, t);

            const data = { route };
    
            t.commit();
    
            socket.emit("route/deleteRoute", { data, message: 'La ruta se ha eliminado correctamente' });
            socket.broadcast.emit('route/deleteRoute', { data });
        } catch(error) {
            t.rollback();

            console.error('RouteController.deleteRoute - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado" });
            }
        }
    }

}
