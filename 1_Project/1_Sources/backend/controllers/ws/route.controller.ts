import { Socket } from 'socket.io';
import { Request, Response } from 'express';

import ControlException from '../../utils/controlException';

import { RouteService } from '../../services/route';
import { FileData } from '../../types/file-attachment.types';
import FileAttachmentService from '../../services/file/file-attachment.bll';

import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];

const sequelize = require('../../models').sequelize;

export class RouteController {
    private routeService = new RouteService();
    private fileAttachmentService = new FileAttachmentService();
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

        // Debug: Log complete request to understand the structure
        console.log('RouteController.editRoute - Request structure:', {
            hasRoute: !!req.route,
            hasFileData: !!req.fileData,
            fileDataKeys: req.fileData ? Object.keys(req.fileData) : 'no fileData',
            fileDataFile: req.fileData?.file ? {
                isBuffer: Buffer.isBuffer(req.fileData.file),
                hasName: !!req.fileData.file.name,
                keys: Object.keys(req.fileData.file).slice(0, 10) // First 10 keys only
            } : 'no file in fileData'
        });

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

    /**
     * Download attached file from route
     * Requirements: 3.3, 3.4, 5.4
     */
    public async downloadAttachedFile(req: Request, res: Response) {
        const fileTrack = req.params.fileTrack;

        try {
            // Validate file track parameter
            if (!fileTrack || fileTrack.trim() === '') {
                return res.status(400).json({ 
                    error: 'El identificador del archivo es obligatorio' 
                });
            }

            // Use FileAttachmentService to download the file
            const downloadResult = await this.fileAttachmentService.downloadAttachedFile(fileTrack);

            // Set appropriate headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${downloadResult.filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', downloadResult.buffer.length);

            // Send the file buffer
            res.send(downloadResult.buffer);

        } catch (error) {
            console.error('RouteController.downloadAttachedFile - Error:', error);
            
            if (error instanceof ControlException) {
                const statusCode = error.code === 404 ? 404 : 500;
                return res.status(statusCode).json({ 
                    error: error.message 
                });
            } else {
                return res.status(500).json({ 
                    error: 'Error no controlado al descargar el archivo' 
                });
            }
        }
    }

}
