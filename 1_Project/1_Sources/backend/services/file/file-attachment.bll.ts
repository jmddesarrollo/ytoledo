import ControlException from '../../utils/controlException';
import FileService from './file.bll';

const db = require("../../models");
const Routes = db.routes;

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

    constructor() {
        // Initialize FileService with appropriate directory and extensions
        // Using a general directory for route attachments and allowing common file types
        const attachmentDirectory = config.folderFiles || './files/';
        const allowedExtensions = ['pdf', 'gpx', 'kml', 'kmz', 'txt', 'doc', 'docx', 'zip', 'rar'];
        
        this.fileManager = new FileService(attachmentDirectory, allowedExtensions);
    }

    /**
     * Attach a file to a route
     * Requirements: 1.2, 1.4, 5.1, 5.2
     */
    public async attachFileToRoute(routeId: number, file: any): Promise<AttachedFile> {
        try {
            // Validate input
            if (!routeId) {
                throw new ControlException('El ID de la ruta es obligatorio', 400);
            }

            if (!file) {
                throw new ControlException('No se ha proporcionado ningún archivo', 400);
            }

            // Check if route exists
            const route = await Routes.findOne({ where: { id: routeId } });
            if (!route) {
                throw new ControlException('La ruta especificada no existe', 404);
            }

            // Generate unique identifier using File_Manager
            const fileTrack = this.fileManager.generateIdentifier();
            const filenameTrack = file.name;

            // Create folder for the file using the fileTrack as folder name
            const folderPath = `attachments/${fileTrack}`;
            
            // Upload file using File_Manager
            this.fileManager.uploadFile(file, folderPath);

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

            // Return attached file information
            const attachedFile: AttachedFile = {
                fileTrack,
                filenameTrack,
                uploadDate: new Date(),
                fileSize: file.size || 0,
                mimeType: file.mimetype || 'application/octet-stream'
            };

            return attachedFile;

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            throw new ControlException('Ha ocurrido un error al adjuntar el archivo a la ruta', 500);
        }
    }

    /**
     * Remove file from route
     * Requirements: 2.3, 5.3
     */
    public async removeFileFromRoute(routeId: number): Promise<void> {
        try {
            // Validate input
            if (!routeId) {
                throw new ControlException('El ID de la ruta es obligatorio', 400);
            }

            // Get route with file information
            const route = await Routes.findOne({ where: { id: routeId } });
            if (!route) {
                throw new ControlException('La ruta especificada no existe', 404);
            }

            // Check if route has an attached file
            if (!route.file_track || route.file_track.trim() === '') {
                throw new ControlException('La ruta no tiene ningún archivo adjunto', 400);
            }

            // Delete file from server using File_Manager
            const folderPath = `attachments/${route.file_track}`;
            this.fileManager.delFiles(folderPath);

            // Clear file information from route
            await Routes.update(
                {
                    file_track: '',
                    filename_track: ''
                },
                {
                    where: { id: routeId }
                }
            );

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            throw new ControlException('Ha ocurrido un error al eliminar el archivo de la ruta', 500);
        }
    }

    /**
     * Get attached file information by file track
     */
    public async getAttachedFile(fileTrack: string): Promise<AttachedFile | null> {
        try {
            if (!fileTrack || fileTrack.trim() === '') {
                throw new ControlException('El identificador del archivo es obligatorio', 400);
            }

            // Find route with this file track
            const route = await Routes.findOne({ 
                where: { file_track: fileTrack },
                raw: true 
            });

            if (!route) {
                return null;
            }

            // Check if file exists on server
            const folderPath = `attachments/${fileTrack}`;
            const filePath = `${folderPath}/${route.filename_track}`;
            
            try {
                // Try to read file to verify it exists
                this.fileManager.downloadFile(`attachments/${fileTrack}`, route.filename_track);
            } catch (fileError) {
                // File doesn't exist on server but exists in database
                throw new ControlException('El archivo no se encuentra en el servidor', 404);
            }

            const attachedFile: AttachedFile = {
                fileTrack: route.file_track,
                filenameTrack: route.filename_track,
                uploadDate: route.updated_at || route.created_at,
                fileSize: 0, // File size would need to be calculated from actual file
                mimeType: 'application/octet-stream' // Would need to be determined from file extension
            };

            return attachedFile;

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            throw new ControlException('Ha ocurrido un error al obtener la información del archivo', 500);
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

            const attachedFiles: AttachedFileWithRoute[] = routesWithFiles.map((route: any) => ({
                fileTrack: route.file_track,
                filenameTrack: route.filename_track,
                uploadDate: route.updated_at || route.created_at,
                fileSize: 0, // Would need to be calculated from actual file
                mimeType: 'application/octet-stream', // Would need to be determined from file extension
                routeId: route.id,
                routeName: route.name,
                routeDate: route.date
            }));

            return attachedFiles;

        } catch (error) {
            throw new ControlException('Ha ocurrido un error al obtener la lista de archivos adjuntos', 500);
        }
    }

    /**
     * Download attached file
     * Requirements: 5.4
     */
    public async downloadAttachedFile(fileTrack: string): Promise<{ buffer: Buffer; filename: string }> {
        try {
            if (!fileTrack || fileTrack.trim() === '') {
                throw new ControlException('El identificador del archivo es obligatorio', 400);
            }

            // Get route information to get filename
            const route = await Routes.findOne({ 
                where: { file_track: fileTrack },
                raw: true 
            });

            if (!route) {
                throw new ControlException('No se encontró ningún archivo con ese identificador', 404);
            }

            if (!route.filename_track || route.filename_track.trim() === '') {
                throw new ControlException('La ruta no tiene un nombre de archivo válido', 400);
            }

            // Use File_Manager to download file
            const folderPath = `attachments/${fileTrack}`;
            const fileBuffer = this.fileManager.downloadFile(folderPath, route.filename_track);

            return {
                buffer: fileBuffer,
                filename: route.filename_track
            };

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            throw new ControlException('Ha ocurrido un error al descargar el archivo', 500);
        }
    }

    /**
     * Delete multiple attached files
     * Requirements: 4.4, 5.3
     */
    public async deleteAttachedFiles(fileTracks: string[]): Promise<void> {
        try {
            if (!fileTracks || fileTracks.length === 0) {
                throw new ControlException('Se debe proporcionar al menos un identificador de archivo', 400);
            }

            // Validate all file tracks exist
            const routes = await Routes.findAll({
                where: {
                    file_track: {
                        [db.Sequelize.Op.in]: fileTracks
                    }
                },
                raw: true
            });

            if (routes.length !== fileTracks.length) {
                throw new ControlException('Algunos archivos especificados no existen', 404);
            }

            // Delete files from server and update database
            for (const route of routes) {
                // Delete file from server using File_Manager
                const folderPath = `attachments/${route.file_track}`;
                this.fileManager.delFiles(folderPath);

                // Clear file information from route
                await Routes.update(
                    {
                        file_track: '',
                        filename_track: ''
                    },
                    {
                        where: { id: route.id }
                    }
                );
            }

        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            throw new ControlException('Ha ocurrido un error al eliminar los archivos', 500);
        }
    }
}

// Export interfaces for use in other modules
export { AttachedFile, RouteWithFile, AttachedFileWithRoute };