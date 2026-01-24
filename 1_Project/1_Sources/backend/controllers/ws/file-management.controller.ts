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

            // Validate request parameters
            const filters = req.filters || {};
            
            // Sanitize and validate filters
            if (filters.page && (!Number.isInteger(filters.page) || filters.page < 1)) {
                filters.page = 1;
            }
            
            if (filters.limit && (!Number.isInteger(filters.limit) || filters.limit < 1 || filters.limit > 100)) {
                filters.limit = 20; // Default limit
            }

            // Get all attached files with route information
            const attachedFiles = await this.fileAttachmentService.getAllAttachedFiles();

            // Apply client-side filtering if needed (since the service doesn't support filtering yet)
            let filteredFiles = attachedFiles;
            
            if (filters.search && typeof filters.search === 'string') {
                const searchTerm = filters.search.toLowerCase().trim();
                if (searchTerm) {
                    filteredFiles = attachedFiles.filter(file => 
                        file.filenameTrack.toLowerCase().includes(searchTerm) ||
                        file.routeName.toLowerCase().includes(searchTerm)
                    );
                }
            }

            // Apply pagination if requested
            let paginatedFiles = filteredFiles;
            let pagination = null;
            
            if (filters.page && filters.limit) {
                const startIndex = (filters.page - 1) * filters.limit;
                const endIndex = startIndex + filters.limit;
                paginatedFiles = filteredFiles.slice(startIndex, endIndex);
                
                pagination = {
                    page: filters.page,
                    limit: filters.limit,
                    total: filteredFiles.length,
                    totalPages: Math.ceil(filteredFiles.length / filters.limit)
                };
            }

            const responseData = pagination ? 
                { files: paginatedFiles, pagination } : 
                paginatedFiles;

            socket.emit("fileManagement/getAttachedFiles", { 
                data: responseData, 
                message: `Se encontraron ${filteredFiles.length} archivo(s) adjunto(s)` 
            });

        } catch (error) {
            console.error('FileManagementController.getAttachedFiles - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { 
                    message: "Error no controlado al obtener los archivos adjuntos", 
                    code: 500 
                });
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

            // Validate array length to prevent abuse
            if (fileTracks.length > 100) {
                throw new ControlException('No se pueden eliminar más de 100 archivos a la vez', 400);
            }

            // Validate all file tracks are strings and not empty
            const validFileTracks: string[] = [];
            const invalidTracks: string[] = [];

            for (const track of fileTracks) {
                if (!track || typeof track !== 'string') {
                    invalidTracks.push(String(track));
                    continue;
                }

                const trimmedTrack = track.trim();
                if (trimmedTrack === '') {
                    invalidTracks.push(track);
                    continue;
                }

                // Sanitize file track to prevent path traversal
                const sanitizedTrack = trimmedTrack.replace(/[^a-zA-Z0-9\-_]/g, '');
                if (sanitizedTrack !== trimmedTrack) {
                    invalidTracks.push(track);
                    continue;
                }

                // Check for reasonable length
                if (sanitizedTrack.length < 10 || sanitizedTrack.length > 50) {
                    invalidTracks.push(track);
                    continue;
                }

                validFileTracks.push(sanitizedTrack);
            }

            if (invalidTracks.length > 0) {
                throw new ControlException(
                    `Los siguientes identificadores de archivo no son válidos: ${invalidTracks.slice(0, 5).join(', ')}${invalidTracks.length > 5 ? '...' : ''}`, 
                    400
                );
            }

            if (validFileTracks.length === 0) {
                throw new ControlException('No hay identificadores de archivo válidos para eliminar', 400);
            }

            // Delete the files
            await this.fileAttachmentService.deleteAttachedFiles(validFileTracks);

            const successMessage = validFileTracks.length === 1 ? 
                'El archivo se ha eliminado correctamente' : 
                `Se han eliminado ${validFileTracks.length} archivo(s) correctamente`;

            socket.emit("fileManagement/deleteAttachedFiles", { 
                data: { 
                    deletedFiles: validFileTracks,
                    deletedCount: validFileTracks.length
                }, 
                message: successMessage
            });

            // Broadcast the change to other connected clients
            socket.broadcast.emit('fileManagement/filesDeleted', { 
                data: { 
                    deletedFiles: validFileTracks,
                    deletedCount: validFileTracks.length
                } 
            });

        } catch (error) {
            console.error('FileManagementController.deleteAttachedFiles - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { 
                    message: "Error no controlado al eliminar los archivos", 
                    code: 500 
                });
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

            // Sanitize file track to prevent path traversal
            const sanitizedFileTrack = fileTrack.replace(/[^a-zA-Z0-9\-_]/g, '');
            if (sanitizedFileTrack !== fileTrack) {
                throw new ControlException('El identificador del archivo contiene caracteres no válidos', 400);
            }

            // Get file information
            const attachedFile = await this.fileAttachmentService.getAttachedFile(sanitizedFileTrack);

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
                socket.emit("error_message", { 
                    message: "Error no controlado al obtener la información del archivo", 
                    code: 500 
                });
            }
        }
    }

    /**
     * Download attached file via WebSocket
     * Requirements: 5.4
     */
    public async downloadAttachedFile(req: any, socket: Socket) {
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

            // Sanitize file track to prevent path traversal
            const sanitizedFileTrack = fileTrack.replace(/[^a-zA-Z0-9\-_]/g, '');
            if (sanitizedFileTrack !== fileTrack) {
                throw new ControlException('El identificador del archivo contiene caracteres no válidos', 400);
            }

            // Download the file
            const downloadResult = await this.fileAttachmentService.downloadAttachedFile(sanitizedFileTrack);

            // Convert buffer to base64 for WebSocket transmission
            const fileData = downloadResult.buffer.toString('base64');

            socket.emit("fileAttachment/downloadAttachedFile", { 
                success: true,
                data: {
                    filename: downloadResult.filename,
                    fileData: fileData
                },
                message: 'Archivo descargado correctamente' 
            });

        } catch (error) {
            console.error('FileManagementController.downloadAttachedFile - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { 
                    message: "Error no controlado al descargar el archivo", 
                    code: 500 
                });
            }
        }
    }

    /**
     * Cleanup orphaned files (files without database records)
     * Requirements: Error Handling section
     */
    public async cleanupOrphanedFiles(req: any, socket: Socket) {
        try {
            this.mode = 'writing';

            // Check authorization
            const tokenDecoded = this.AuthorizedMiddleware.checkToken(req.token, socket);
            await this.AuthorizedMiddleware.isAllowed(tokenDecoded, this.permissionType, this.mode, socket);

            // Perform cleanup
            const result = await this.fileAttachmentService.cleanupOrphanedFiles();

            let message = `Limpieza completada. Se eliminaron ${result.cleaned} archivo(s) huérfano(s)`;
            if (result.errors.length > 0) {
                message += `. Se encontraron ${result.errors.length} error(es) durante la limpieza`;
            }

            socket.emit("fileManagement/cleanupOrphanedFiles", { 
                data: result, 
                message: message
            });

            // Log cleanup results
            if (result.cleaned > 0) {
                console.log(`Cleanup completed: ${result.cleaned} orphaned files removed`);
            }
            if (result.errors.length > 0) {
                console.warn('Cleanup errors:', result.errors);
            }

        } catch (error) {
            console.error('FileManagementController.cleanupOrphanedFiles - Error:', error);
            if (error instanceof ControlException) {
                socket.emit("error_message", { message: error.message, code: error.code });
            } else {
                socket.emit("error_message", { 
                    message: "Error no controlado durante la limpieza de archivos huérfanos", 
                    code: 500 
                });
            }
        }
    }
}