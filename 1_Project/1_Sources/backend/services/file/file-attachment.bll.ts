import ControlException from '../../utils/controlException';
import FileService from './file.bll';
import FileValidator, { FileValidationConfig } from '../../utils/fileValidation';

const db = require("../../models");
const Routes = db.routes;
const fs = require('fs');
const path = require('path');

const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];

// Interfaces for type safety
interface AttachedFile {
    fileTrack: string;
    filenameTrack: string;
    uploadDate: Date;
    fileSize: number;
    mimeType: string;
}

interface RouteWithFile {
    id: number;
    name: string;
    date: Date;
    file_track: string;
    filename_track: string;
    [key: string]: any; // For other route properties
}

interface AttachedFileWithRoute extends AttachedFile {
    routeId: number;
    routeName: string;
    routeDate: Date;
}

export default class FileAttachmentService {
    private fileManager: FileService;
    private fileValidator: FileValidator;

    constructor(validationConfig?: Partial<FileValidationConfig>) {
        // Initialize FileService with appropriate directory and extensions
        const attachmentDirectory = config.folderFiles || './files/';
        const allowedExtensions = validationConfig?.allowedExtensions || ['pdf', 'gpx', 'kml', 'kmz', 'txt', 'doc', 'docx', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'gif', 'bmp'];
        
        this.fileManager = new FileService(attachmentDirectory, allowedExtensions);
        
        // Initialize file validator
        this.fileValidator = new FileValidator(validationConfig);
    }

    /**
     * Validate file before processing
     * Requirements: Error Handling section
     */
    private validateFile(file: any): void {
        this.fileValidator.validateFile(file);
    }

    /**
     * Check if file exists on disk
     */
    private async checkFileExists(fileTrack: string, filename: string): Promise<boolean> {
        try {
            const folderPath = path.join(this.fileManager['directory'], 'attachments', fileTrack);
            const filePath = path.join(folderPath, filename);
            return fs.existsSync(filePath);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get actual file size from disk
     */
    private async getFileSize(fileTrack: string, filename: string): Promise<number> {
        try {
            const folderPath = path.join(this.fileManager['directory'], 'attachments', fileTrack);
            const filePath = path.join(folderPath, filename);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                return stats.size;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Cleanup orphaned files (files without database records)
     * Requirements: Error Handling section
     */
    public async cleanupOrphanedFiles(): Promise<{ cleaned: number; errors: string[] }> {
        const errors: string[] = [];
        let cleaned = 0;

        try {
            const attachmentsDir = path.join(this.fileManager['directory'], 'attachments');
            
            if (!fs.existsSync(attachmentsDir)) {
                return { cleaned: 0, errors: [] };
            }

            // Get all file track directories
            const fileTrackDirs = fs.readdirSync(attachmentsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            // Get all file tracks from database
            const routesWithFiles = await Routes.findAll({
                where: {
                    file_track: {
                        [db.Sequelize.Op.ne]: ''
                    }
                },
                attributes: ['file_track'],
                raw: true
            });

            const dbFileTracks = new Set(routesWithFiles.map((route: any) => route.file_track));

            // Find orphaned directories
            for (const fileTrack of fileTrackDirs) {
                if (!dbFileTracks.has(fileTrack)) {
                    try {
                        const orphanedPath = path.join(attachmentsDir, fileTrack);
                        this.fileManager.delFiles(`attachments/${fileTrack}`);
                        cleaned++;
                    } catch (error) {
                        errors.push(`Error eliminando archivo huérfano ${fileTrack}: ${error.message}`);
                    }
                }
            }

            return { cleaned, errors };

        } catch (error) {
            errors.push(`Error durante la limpieza de archivos huérfanos: ${error.message}`);
            return { cleaned, errors };
        }
    }

    /**
     * Validate route exists and user has permissions
     */
    private async validateRouteAccess(routeId: number): Promise<any> {
        if (!routeId || !Number.isInteger(routeId) || routeId <= 0) {
            throw new ControlException('El ID de la ruta debe ser un número entero válido', 400);
        }

        const route = await Routes.findOne({ where: { id: routeId } });
        if (!route) {
            throw new ControlException('La ruta especificada no existe', 404);
        }

        return route;
    }

    /**
     * Attach a file to a route
     * Requirements: 1.2, 1.4, 5.1, 5.2
     */
    public async attachFileToRoute(routeId: number, file: any): Promise<AttachedFile> {
        try {
            // Validate route access
            const route = await this.validateRouteAccess(routeId);

            // Validate file
            this.validateFile(file);

            // Check if route already has a file attached
            if (route.file_track && route.file_track.trim() !== '') {
                throw new ControlException('La ruta ya tiene un archivo adjunto. Debe eliminarlo primero antes de adjuntar uno nuevo', 400);
            }

            // Generate unique identifier using File_Manager
            const fileTrack = this.fileManager.generateIdentifier();
            const filenameTrack = file.name;

            // Create folder for the file using the fileTrack as folder name
            const folderPath = `attachments/${fileTrack}`;
            
            try {
                // Upload file using File_Manager
                this.fileManager.uploadFile(file, folderPath);
            } catch (uploadError) {
                // Clean up folder if upload failed
                try {
                    this.fileManager.delFiles(folderPath);
                } catch (cleanupError) {
                    // Log cleanup error but don't throw
                    console.error('Error cleaning up failed upload:', cleanupError);
                }
                
                if (uploadError instanceof ControlException) {
                    throw uploadError;
                } else {
                    throw new ControlException('Error al subir el archivo al servidor', 500);
                }
            }

            try {
                // Update route with file information
                await Routes.update(
                    {
                        file_track: fileTrack,
                        filename_track: filenameTrack
                    },
                    {
                        where: { id: routeId }
                    }
                );
            } catch (dbError) {
                // Clean up uploaded file if database update failed
                try {
                    this.fileManager.delFiles(folderPath);
                } catch (cleanupError) {
                    console.error('Error cleaning up after database failure:', cleanupError);
                }
                
                throw new ControlException('Error al actualizar la información del archivo en la base de datos', 500);
            }

            // Get actual file size from disk
            const actualFileSize = await this.getFileSize(fileTrack, filenameTrack);

            // Return attached file information
            const attachedFile: AttachedFile = {
                fileTrack,
                filenameTrack,
                uploadDate: new Date(),
                fileSize: actualFileSize || file.size || 0,
                mimeType: file.mimetype || this.getMimeTypeFromExtension(filenameTrack)
            };

            return attachedFile;

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            console.error('FileAttachmentService.attachFileToRoute - Unexpected error:', error);
            throw new ControlException('Ha ocurrido un error inesperado al adjuntar el archivo a la ruta', 500);
        }
    }

    /**
     * Get MIME type from file extension
     */
    private getMimeTypeFromExtension(filename: string): string {
        return FileValidator.getMimeTypeFromExtension(filename);
    }

    /**
     * Remove file from route
     * Requirements: 2.3, 5.3
     */
    public async removeFileFromRoute(routeId: number): Promise<void> {
        try {
            // Validate route access
            const route = await this.validateRouteAccess(routeId);

            // Check if route has an attached file
            if (!route.file_track || route.file_track.trim() === '') {
                throw new ControlException('La ruta no tiene ningún archivo adjunto', 400);
            }

            const fileTrack = route.file_track;
            const filename = route.filename_track;

            // Check if file exists on disk before attempting deletion
            const fileExists = await this.checkFileExists(fileTrack, filename);
            
            let fileDeletedSuccessfully = false;
            let fileDeleteError = null;

            if (fileExists) {
                try {
                    // Delete file from server using File_Manager
                    const folderPath = `attachments/${fileTrack}`;
                    this.fileManager.delFiles(folderPath);
                    fileDeletedSuccessfully = true;
                } catch (deleteError) {
                    fileDeleteError = deleteError;
                    console.error(`Error deleting file ${fileTrack}:`, deleteError);
                }
            } else {
                // File doesn't exist on disk, but we'll still clean up the database
                console.warn(`File ${fileTrack} not found on disk, cleaning up database record only`);
                fileDeletedSuccessfully = true; // Consider it successful since file is already gone
            }

            try {
                // Clear file information from route regardless of file deletion result
                await Routes.update(
                    {
                        file_track: '',
                        filename_track: ''
                    },
                    {
                        where: { id: routeId }
                    }
                );
            } catch (dbError) {
                // If database update fails but file was deleted, we have an inconsistent state
                if (fileDeletedSuccessfully && fileExists) {
                    console.error('Critical: File deleted but database update failed. Manual cleanup required.', {
                        routeId,
                        fileTrack,
                        dbError
                    });
                }
                throw new ControlException('Error al actualizar la información del archivo en la base de datos', 500);
            }

            // If file deletion failed but database was updated, log warning
            if (!fileDeletedSuccessfully && fileDeleteError) {
                console.warn('File deletion failed but database was cleaned up:', {
                    routeId,
                    fileTrack,
                    error: fileDeleteError
                });
                // Don't throw error here as the database is now consistent
            }

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            console.error('FileAttachmentService.removeFileFromRoute - Unexpected error:', error);
            throw new ControlException('Ha ocurrido un error inesperado al eliminar el archivo de la ruta', 500);
        }
    }

    /**
     * Get attached file information by file track
     */
    public async getAttachedFile(fileTrack: string): Promise<AttachedFile | null> {
        try {
            // Validate and sanitize file track
            const sanitizedFileTrack = FileValidator.validateFileTrack(fileTrack);

            // Find route with this file track
            const route = await Routes.findOne({ 
                where: { file_track: sanitizedFileTrack },
                raw: true 
            });

            if (!route) {
                return null;
            }

            if (!route.filename_track || route.filename_track.trim() === '') {
                throw new ControlException('La información del archivo está incompleta en la base de datos', 500);
            }

            // Check if file exists on server
            const fileExists = await this.checkFileExists(sanitizedFileTrack, route.filename_track);
            
            if (!fileExists) {
                // File doesn't exist on server but exists in database - inconsistent state
                console.error('File inconsistency detected:', {
                    fileTrack: sanitizedFileTrack,
                    filename: route.filename_track,
                    routeId: route.id
                });
                throw new ControlException('El archivo no se encuentra en el servidor. Es posible que haya sido eliminado manualmente', 404);
            }

            // Get actual file size from disk
            const actualFileSize = await this.getFileSize(sanitizedFileTrack, route.filename_track);

            const attachedFile: AttachedFile = {
                fileTrack: route.file_track,
                filenameTrack: route.filename_track,
                uploadDate: route.updated_at || route.created_at,
                fileSize: actualFileSize,
                mimeType: this.getMimeTypeFromExtension(route.filename_track)
            };

            return attachedFile;

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            console.error('FileAttachmentService.getAttachedFile - Unexpected error:', error);
            throw new ControlException('Ha ocurrido un error inesperado al obtener la información del archivo', 500);
        }
    }

    /**
     * Get all attached files with their route information
     */
    public async getAllAttachedFiles(): Promise<AttachedFileWithRoute[]> {
        try {
            // Get all routes that have attached files
            const routesWithFiles = await Routes.findAll({
                where: {
                    file_track: {
                        [db.Sequelize.Op.ne]: ''
                    }
                },
                attributes: ['id', 'name', 'date', 'file_track', 'filename_track', 'created_at', 'updated_at'],
                order: [['updated_at', 'DESC']],
                raw: true
            });

            const attachedFiles: AttachedFileWithRoute[] = [];
            const inconsistentFiles: string[] = [];

            for (const route of routesWithFiles) {
                try {
                    // Validate file track and filename
                    if (!route.file_track || !route.filename_track) {
                        console.warn('Route with incomplete file information:', route.id);
                        continue;
                    }

                    // Check if file exists on disk
                    const fileExists = await this.checkFileExists(route.file_track, route.filename_track);
                    
                    if (!fileExists) {
                        inconsistentFiles.push(`${route.file_track} (${route.filename_track})`);
                        console.warn('File inconsistency detected for route:', {
                            routeId: route.id,
                            fileTrack: route.file_track,
                            filename: route.filename_track
                        });
                        // Skip this file but continue with others
                        continue;
                    }

                    // Get actual file size from disk
                    const actualFileSize = await this.getFileSize(route.file_track, route.filename_track);

                    const attachedFile: AttachedFileWithRoute = {
                        fileTrack: route.file_track,
                        filenameTrack: route.filename_track,
                        uploadDate: route.updated_at || route.created_at,
                        fileSize: actualFileSize,
                        mimeType: this.getMimeTypeFromExtension(route.filename_track),
                        routeId: route.id,
                        routeName: route.name,
                        routeDate: route.date
                    };

                    attachedFiles.push(attachedFile);

                } catch (fileError) {
                    console.error('Error processing file for route:', route.id, fileError);
                    // Continue with other files
                }
            }

            // Log inconsistencies if found
            if (inconsistentFiles.length > 0) {
                console.warn(`Found ${inconsistentFiles.length} files with database records but missing from disk:`, inconsistentFiles);
            }

            return attachedFiles;

        } catch (error) {
            console.error('FileAttachmentService.getAllAttachedFiles - Unexpected error:', error);
            throw new ControlException('Ha ocurrido un error inesperado al obtener la lista de archivos adjuntos', 500);
        }
    }

    /**
     * Download attached file
     * Requirements: 5.4
     */
    public async downloadAttachedFile(fileTrack: string): Promise<{ buffer: Buffer; filename: string }> {
        try {
            // Validate and sanitize file track
            const sanitizedFileTrack = FileValidator.validateFileTrack(fileTrack);

            // Get route information to get filename
            const route = await Routes.findOne({ 
                where: { file_track: sanitizedFileTrack },
                raw: true 
            });

            if (!route) {
                throw new ControlException('No se encontró ningún archivo con ese identificador', 404);
            }

            if (!route.filename_track || route.filename_track.trim() === '') {
                throw new ControlException('La ruta no tiene un nombre de archivo válido', 400);
            }

            // Check if file exists on server before attempting download
            const fileExists = await this.checkFileExists(sanitizedFileTrack, route.filename_track);
            
            if (!fileExists) {
                throw new ControlException('El archivo no se encuentra en el servidor. Es posible que haya sido eliminado', 404);
            }

            try {
                // Use File_Manager to download file
                const folderPath = `attachments/${sanitizedFileTrack}`;
                const fileBuffer = this.fileManager.downloadFile(folderPath, route.filename_track);

                // Validate that we got a valid buffer
                if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
                    throw new ControlException('Error al leer el archivo del servidor', 500);
                }

                if (fileBuffer.length === 0) {
                    throw new ControlException('El archivo está vacío o corrupto', 500);
                }

                return {
                    buffer: fileBuffer,
                    filename: route.filename_track
                };

            } catch (downloadError) {
                if (downloadError instanceof ControlException) {
                    throw downloadError;
                }
                
                console.error('File download error:', {
                    fileTrack: sanitizedFileTrack,
                    filename: route.filename_track,
                    error: downloadError
                });
                
                throw new ControlException('Error al leer el archivo del servidor', 500);
            }

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            console.error('FileAttachmentService.downloadAttachedFile - Unexpected error:', error);
            throw new ControlException('Ha ocurrido un error inesperado al descargar el archivo', 500);
        }
    }

    /**
     * Delete multiple attached files
     * Requirements: 4.4, 5.3
     */
    public async deleteAttachedFiles(fileTracks: string[]): Promise<void> {
        try {
            if (!fileTracks || !Array.isArray(fileTracks) || fileTracks.length === 0) {
                throw new ControlException('Se debe proporcionar al menos un identificador de archivo', 400);
            }

            // Validate and sanitize all file tracks
            const validFileTracks: string[] = [];
            const invalidTracks: string[] = [];

            for (const track of fileTracks) {
                if (!track || typeof track !== 'string' || track.trim() === '') {
                    invalidTracks.push(track);
                    continue;
                }

                // Sanitize file track to prevent path traversal
                const sanitizedTrack = track.replace(/[^a-zA-Z0-9\-_]/g, '');
                if (sanitizedTrack !== track) {
                    invalidTracks.push(track);
                    continue;
                }

                validFileTracks.push(track);
            }

            if (invalidTracks.length > 0) {
                throw new ControlException(`Los siguientes identificadores de archivo no son válidos: ${invalidTracks.join(', ')}`, 400);
            }

            // Validate all file tracks exist in database
            const routes = await Routes.findAll({
                where: {
                    file_track: {
                        [db.Sequelize.Op.in]: validFileTracks
                    }
                },
                raw: true
            });

            if (routes.length !== validFileTracks.length) {
                const foundTracks = routes.map((route: any) => route.file_track);
                const missingTracks = validFileTracks.filter(track => !foundTracks.includes(track));
                throw new ControlException(`Los siguientes archivos no existen: ${missingTracks.join(', ')}`, 404);
            }

            const deletionResults: { success: string[]; failed: string[]; errors: string[] } = {
                success: [],
                failed: [],
                errors: []
            };

            // Delete files from server and update database
            for (const route of routes) {
                const fileTrack = route.file_track;
                const filename = route.filename_track;

                try {
                    // Check if file exists on disk
                    const fileExists = await this.checkFileExists(fileTrack, filename);
                    
                    let fileDeletedSuccessfully = false;
                    
                    if (fileExists) {
                        try {
                            // Delete file from server using File_Manager
                            const folderPath = `attachments/${fileTrack}`;
                            this.fileManager.delFiles(folderPath);
                            fileDeletedSuccessfully = true;
                        } catch (deleteError) {
                            console.error(`Error deleting file ${fileTrack}:`, deleteError);
                            deletionResults.errors.push(`Error eliminando archivo ${filename}: ${deleteError.message}`);
                        }
                    } else {
                        // File doesn't exist on disk, but we'll still clean up the database
                        console.warn(`File ${fileTrack} not found on disk, cleaning up database record only`);
                        fileDeletedSuccessfully = true;
                    }

                    try {
                        // Clear file information from route regardless of file deletion result
                        await Routes.update(
                            {
                                file_track: '',
                                filename_track: ''
                            },
                            {
                                where: { id: route.id }
                            }
                        );

                        if (fileDeletedSuccessfully || !fileExists) {
                            deletionResults.success.push(fileTrack);
                        } else {
                            deletionResults.failed.push(fileTrack);
                        }

                    } catch (dbError) {
                        console.error(`Database update failed for file ${fileTrack}:`, dbError);
                        deletionResults.failed.push(fileTrack);
                        deletionResults.errors.push(`Error actualizando base de datos para ${filename}: ${dbError.message}`);
                    }

                } catch (routeError) {
                    console.error(`Error processing route ${route.id}:`, routeError);
                    deletionResults.failed.push(fileTrack);
                    deletionResults.errors.push(`Error procesando archivo ${filename}: ${routeError.message}`);
                }
            }

            // Report results
            if (deletionResults.failed.length > 0) {
                const errorMessage = `Se eliminaron ${deletionResults.success.length} archivos correctamente, pero ${deletionResults.failed.length} archivos fallaron`;
                if (deletionResults.errors.length > 0) {
                    console.error('Deletion errors:', deletionResults.errors);
                }
                throw new ControlException(errorMessage, 500);
            }

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            console.error('FileAttachmentService.deleteAttachedFiles - Unexpected error:', error);
            throw new ControlException('Ha ocurrido un error inesperado al eliminar los archivos', 500);
        }
    }
}

// Export interfaces for use in other modules
export { AttachedFile, RouteWithFile, AttachedFileWithRoute, FileValidationConfig };