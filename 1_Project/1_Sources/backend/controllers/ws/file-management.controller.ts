import { Socket } from 'socket.io';

import ControlException from '../../utils/controlException';
import FileAttachmentService from '../../services/file/file-attachment.bll';
import { RouteService } from '../../services/route';
import AuthorizedMiddleware from '../../server/middlewares/authorized.middleware';

const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];

/**
 * Controller for file management operations
 * Requirements: 4.1, 4.2, 4.4
 */
export class FileManagementController {
    private fileAttachmentService = new FileAttachmentService();
    private routeService = new RouteService();
    private AuthorizedMiddleware = new AuthorizedMiddleware();

    private permissionType: string;
    private mode: string;

    constructor() {
        this.permissionType = config.permission_routes_manager;
        this.mode = 'reading';
    }

    /**
     * Get all attached files with their route information
     * Requirements: 4.1, 4.2
     */
    public async getAttachedFiles(req: any, socket: Socket) {
        try {
            this.mode = 'reading';

            // Check authorization
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            // Get all attached files with route information
            const attachedFiles = await this.fileAttachmentService.getAllAttachedFiles();

            socket.emit("fileManagement/getAttachedFiles", { 
                data: attachedFiles, 
                message: 'Los archivos adjuntos se han consultado correctamente' 
            });

        } catch (error) {
            console.error('FileManagementController.getAttachedFiles - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado al obtener los archivos adjuntos" });
            }
        }
    }

    /**
     * Get routes with attached files for management page
     * Requirements: 4.1, 4.2
     */
    public async getRoutesWithFiles(req: any, socket: Socket) {
        try {
            this.mode = 'reading';

            // Check authorization
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            // Get routes with attached files
            const routesWithFiles = await this.routeService.getRoutesWithFiles();

            socket.emit("fileManagement/getRoutesWithFiles", { 
                data: routesWithFiles, 
                message: 'Las rutas con archivos adjuntos se han consultado correctamente' 
            });

        } catch (error) {
            console.error('FileManagementController.getRoutesWithFiles - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado al obtener las rutas con archivos" });
            }
        }
    }

    /**
     * Delete multiple attached files
     * Requirements: 4.4
     */
    public async deleteAttachedFiles(req: any, socket: Socket) {
        const fileTracks: string[] = req.fileTracks;

        try {
            this.mode = 'writing';

            // Check authorization
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            // Validate input
            if (!fileTracks || !Array.isArray(fileTracks) || fileTracks.length === 0) {
                throw new ControlException('Se debe proporcionar al menos un identificador de archivo', 400);
            }

            // Validate all file tracks are strings and not empty
            const validFileTracks = fileTracks.filter(track => 
                typeof track === 'string' && track.trim() !== ''
            );

            if (validFileTracks.length !== fileTracks.length) {
                throw new ControlException('Todos los identificadores de archivo deben ser válidos', 400);
            }

            // Delete the files
            await this.fileAttachmentService.deleteAttachedFiles(validFileTracks);

            socket.emit("fileManagement/deleteAttachedFiles", { 
                data: { deletedFiles: validFileTracks }, 
                message: `Se han eliminado ${validFileTracks.length} archivo(s) correctamente` 
            });

            // Broadcast the change to other connected clients
            socket.broadcast.emit('fileManagement/filesDeleted', { 
                data: { deletedFiles: validFileTracks } 
            });

        } catch (error) {
            console.error('FileManagementController.deleteAttachedFiles - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado al eliminar los archivos" });
            }
        }
    }

    /**
     * Delete a single attached file
     * Requirements: 4.4
     */
    public async deleteAttachedFile(req: any, socket: Socket) {
        const fileTrack: string = req.fileTrack;

        try {
            this.mode = 'writing';

            // Check authorization
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            // Validate input
            if (!fileTrack || typeof fileTrack !== 'string' || fileTrack.trim() === '') {
                throw new ControlException('El identificador del archivo es obligatorio', 400);
            }

            // Delete the file using the multiple files method
            await this.fileAttachmentService.deleteAttachedFiles([fileTrack]);

            socket.emit("fileManagement/deleteAttachedFile", { 
                data: { deletedFile: fileTrack }, 
                message: 'El archivo se ha eliminado correctamente' 
            });

            // Broadcast the change to other connected clients
            socket.broadcast.emit('fileManagement/fileDeleted', { 
                data: { deletedFile: fileTrack } 
            });

        } catch (error) {
            console.error('FileManagementController.deleteAttachedFile - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado al eliminar el archivo" });
            }
        }
    }

    /**
     * Get file information by file track
     */
    public async getAttachedFile(req: any, socket: Socket) {
        const fileTrack: string = req.fileTrack;

        try {
            this.mode = 'reading';

            // Check authorization
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            // Validate input
            if (!fileTrack || typeof fileTrack !== 'string' || fileTrack.trim() === '') {
                throw new ControlException('El identificador del archivo es obligatorio', 400);
            }

            // Get file information
            const attachedFile = await this.fileAttachmentService.getAttachedFile(fileTrack);

            if (!attachedFile) {
                throw new ControlException('No se encontró el archivo especificado', 404);
            }

            socket.emit("fileManagement/getAttachedFile", { 
                data: attachedFile, 
                message: 'La información del archivo se ha consultado correctamente' 
            });

        } catch (error) {
            console.error('FileManagementController.getAttachedFile - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { message: "Error no controlado al obtener la información del archivo" });
            }
        }
    }
}