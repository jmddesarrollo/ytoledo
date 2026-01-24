import ControlException from '../../utils/controlException';

import RouteDAL from './route.dal';
import FileAttachmentService from '../file/file-attachment.bll';
import { FileData, RouteWithFile, AttachedFileWithRoute } from '../../types/file-attachment.types';

const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];
//

export default class RouteService {
    private routeDAL = new RouteDAL();
    private fileAttachmentService = new FileAttachmentService();

    constructor() { }

    public async getRoutes(filters?: any) {
        const routes = await this.routeDAL.getRoutes(filters);
        
        // Si hay paginación, también obtener el total
        if (filters && filters.page && filters.limit) {
            const total = await this.routeDAL.getRoutesCount(filters);
            const totalPages = Math.ceil(total / filters.limit);
            
            return {
                routes,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total,
                    totalPages
                }
            };
        }

        return { routes };
    }

    public async getRoute(id: number) {
        const route = await this.routeDAL.getRoute(id);

        return route;
    }

    public async getNextRoute() {
        const route = await this.routeDAL.getNextRoute();

        return route;
    }

    public async addRoute(route: any, t: any, userId?: number, fileData?: FileData) {
        // Validaciones básicas
        this.validateRouteData(route);
        
        // Verificar que el nombre sea único
        await this.validateUniqueRouteName(route.name);

        // Asignar el user_id si se proporciona
        if (userId) {
            route.user_id = userId;
        }

        // Validar que user_id esté presente
        if (!route.user_id) {
            throw new ControlException('El ID del usuario es obligatorio para crear una ruta', 400);
        }

        // Crear la ruta primero
        const routeDb = await this.routeDAL.addRoute(route, t);

        // Si hay datos de archivo, procesarlos después de crear la ruta
        if (fileData && fileData.file) {
            try {
                await this.fileAttachmentService.attachFileToRoute(routeDb.id, fileData.file);
            } catch (fileError) {
                // Si falla la subida del archivo, eliminar la ruta creada
                await this.routeDAL.deleteRoute(routeDb.id, t);
                throw new ControlException('Error al adjuntar el archivo: ' + (fileError as Error).message, 500);
            }
        }

        return routeDb;
    }

    public async editRoute(route: any, t: any, fileData?: FileData) {
        const routeDB = await this.getRoute(route.id);

        if (!routeDB) throw new ControlException('La ruta no ha sido encontrada', 412);

        // Validaciones básicas
        this.validateRouteData(route);
        
        // Verificar que el nombre sea único (excluyendo la ruta actual)
        if (route.name && route.name !== routeDB.name) {
            await this.validateUniqueRouteName(route.name, route.id);
        }

        // Procesar operaciones de archivo antes de actualizar otros campos
        if (fileData) {
            if (fileData.removeExisting) {
                // Eliminar archivo existente si se solicita
                try {
                    await this.fileAttachmentService.removeFileFromRoute(route.id);
                } catch (fileError) {
                    // Si no hay archivo para eliminar, continuar normalmente
                    console.warn('No se pudo eliminar el archivo:', (fileError as Error).message);
                }
            } else if (fileData.file) {
                // Si hay un archivo existente, eliminarlo primero
                if (routeDB.file_track && routeDB.file_track.trim() !== '') {
                    try {
                        await this.fileAttachmentService.removeFileFromRoute(route.id);
                    } catch (fileError) {
                        console.warn('No se pudo eliminar el archivo anterior:', (fileError as Error).message);
                    }
                }
                
                // Adjuntar el nuevo archivo
                try {
                    await this.fileAttachmentService.attachFileToRoute(route.id, fileData.file);
                } catch (fileError) {
                    throw new ControlException('Error al adjuntar el archivo: ' + (fileError as Error).message, 500);
                }
            }
        }

        // Actualizar campos de la ruta
        if (route.date !== undefined) routeDB.date = route.date;
        if (route.name !== undefined) routeDB.name = route.name;
        if (route.start_point !== undefined) routeDB.start_point = route.start_point;
        if (route.description !== undefined) routeDB.description = route.description;
        if (route.distance_km !== undefined) routeDB.distance_km = route.distance_km;
        if (route.distance_m !== undefined) routeDB.distance_m = route.distance_m;
        if (route.elevation_gain !== undefined) routeDB.elevation_gain = route.elevation_gain;
        if (route.max_height !== undefined) routeDB.max_height = route.max_height;
        if (route.min_height !== undefined) routeDB.min_height = route.min_height;
        if (route.estimated_duration_hours !== undefined) routeDB.estimated_duration_hours = route.estimated_duration_hours;
        if (route.estimated_duration_minutes !== undefined) routeDB.estimated_duration_minutes = route.estimated_duration_minutes;
        if (route.type !== undefined) routeDB.type = route.type;
        if (route.difficulty !== undefined) routeDB.difficulty = route.difficulty;
        if (route.sign_up_link !== undefined) routeDB.sign_up_link = route.sign_up_link;
        if (route.wikiloc_link !== undefined) routeDB.wikiloc_link = route.wikiloc_link;
        if (route.wikiloc_map_link !== undefined) routeDB.wikiloc_map_link = route.wikiloc_map_link;

        const routeOut = await this.routeDAL.editRoute(routeDB, t);

        return routeOut;
    }

    public async deleteRoute(routeId: number, t: any) {
        const routeDB = await this.getRoute(routeId);

        if (!routeDB) throw new ControlException('La ruta no ha sido encontrada', 412);

        // Si la ruta tiene un archivo adjunto, eliminarlo primero
        if (routeDB.file_track && routeDB.file_track.trim() !== '') {
            try {
                await this.fileAttachmentService.removeFileFromRoute(routeId);
            } catch (fileError) {
                console.warn('No se pudo eliminar el archivo adjunto:', (fileError as Error).message);
                // Continuar con la eliminación de la ruta aunque falle la eliminación del archivo
            }
        }

        await this.routeDAL.deleteRoute(routeId, t);

        return true;
    }

    /**
     * Remove file from route - clears file_track and filename_track fields
     * Requirements: 2.2, 2.4
     */
    public async removeFileFromRoute(routeId: number): Promise<void> {
        try {
            await this.fileAttachmentService.removeFileFromRoute(routeId);
        } catch (error) {
            if (error instanceof ControlException) {
                throw error;
            }
            throw new ControlException('Ha ocurrido un error al eliminar el archivo de la ruta', 500);
        }
    }

    /**
     * Get routes with their attached files for management page
     * Requirements: 4.1, 4.2
     */
    public async getRoutesWithFiles(): Promise<RouteWithFile[]> {
        try {
            // Get all routes that have attached files
            const routes = await this.routeDAL.getRoutes();
            
            const routesWithFiles: RouteWithFile[] = routes
                .filter((route: any) => route.file_track && route.file_track.trim() !== '')
                .map((route: any) => ({
                    id: route.id,
                    name: route.name,
                    date: route.date,
                    start_point: route.start_point,
                    description: route.description,
                    distance_km: route.distance_km,
                    distance_m: route.distance_m,
                    elevation_gain: route.elevation_gain,
                    max_height: route.max_height,
                    min_height: route.min_height,
                    estimated_duration_hours: route.estimated_duration_hours,
                    estimated_duration_minutes: route.estimated_duration_minutes,
                    type: route.type,
                    difficulty: route.difficulty,
                    sign_up_link: route.sign_up_link,
                    wikiloc_link: route.wikiloc_link,
                    wikiloc_map_link: route.wikiloc_map_link,
                    user_id: route.user_id,
                    file_track: route.file_track,
                    filename_track: route.filename_track,
                    created_at: route.created_at,
                    updated_at: route.updated_at,
                    attachedFile: {
                        fileTrack: route.file_track,
                        filenameTrack: route.filename_track,
                        uploadDate: route.updated_at || route.created_at,
                        fileSize: 0, // Would need to be calculated from actual file
                        mimeType: 'application/octet-stream' // Would need to be determined from file extension
                    }
                }));

            return routesWithFiles;

        } catch (error) {
            throw new ControlException('Ha ocurrido un error al obtener las rutas con archivos adjuntos', 500);
        }
    }

    /**
     * Create route with optional file attachment
     * Requirements: 1.3
     */
    public async createRouteWithFile(routeData: any, fileData: FileData | undefined, t: any, userId?: number): Promise<any> {
        return this.addRoute(routeData, t, userId, fileData);
    }

    /**
     * Update route with optional file operations
     * Requirements: 1.3, 2.2
     */
    public async updateRouteWithFile(routeId: number, routeData: any, fileData: FileData | undefined, t: any): Promise<any> {
        // Ensure the route ID is set in the route data
        routeData.id = routeId;
        return this.editRoute(routeData, t, fileData);
    }

    // Métodos de validación
    private validateRouteData(route: any) {
        // Validar campos obligatorios
        if (!route.name || route.name.trim().length === 0) {
            throw new ControlException('El nombre de la ruta es obligatorio', 400);
        }
        
        if (route.name.length < 3 || route.name.length > 150) {
            throw new ControlException('El nombre de la ruta debe tener entre 3 y 150 caracteres', 400);
        }

        if (!route.date) {
            throw new ControlException('La fecha de la ruta es obligatoria', 400);
        }

        if (!route.start_point || route.start_point.trim().length === 0) {
            throw new ControlException('El punto de inicio es obligatorio', 400);
        }

        // Validar campos numéricos obligatorios
        if (route.distance_km === undefined || route.distance_km === null || isNaN(route.distance_km) || route.distance_km < 0) {
            throw new ControlException('La distancia en kilómetros es obligatoria y debe ser un número positivo', 400);
        }

        if (route.distance_m === undefined || route.distance_m === null || isNaN(route.distance_m) || route.distance_m < 0) {
            throw new ControlException('La distancia en metros es obligatoria y debe ser un número positivo', 400);
        }

        if (route.elevation_gain === undefined || route.elevation_gain === null || isNaN(route.elevation_gain) || route.elevation_gain < 0) {
            throw new ControlException('El desnivel acumulado es obligatorio y debe ser un número positivo', 400);
        }

        if (route.max_height === undefined || route.max_height === null || isNaN(route.max_height)) {
            throw new ControlException('La altura máxima es obligatoria', 400);
        }

        if (route.min_height === undefined || route.min_height === null || isNaN(route.min_height)) {
            throw new ControlException('La altura mínima es obligatoria', 400);
        }

        if (route.estimated_duration_hours === undefined || route.estimated_duration_hours === null || isNaN(route.estimated_duration_hours) || route.estimated_duration_hours < 0 || route.estimated_duration_hours > 23) {
            throw new ControlException('Las horas de duración son obligatorias y deben estar entre 0 y 23', 400);
        }
        
        if (route.estimated_duration_minutes === undefined || route.estimated_duration_minutes === null || isNaN(route.estimated_duration_minutes) || route.estimated_duration_minutes < 0 || route.estimated_duration_minutes > 59) {
            throw new ControlException('Los minutos de duración son obligatorios y deben estar entre 0 y 59', 400);
        }

        if (route.type === undefined || route.type === null || ![1, 2, 3].includes(route.type)) {
            throw new ControlException('El tipo de ruta es obligatorio (1=Circular, 2=Lineal, 3=Travesía)', 400);
        }

        if (!route.difficulty || route.difficulty.trim().length === 0) {
            throw new ControlException('La dificultad es obligatoria', 400);
        }

        // Validar descripción si se proporciona
        if (route.description && route.description.length > 1000) {
            throw new ControlException('La descripción no puede exceder 1000 caracteres', 400);
        }

        // Validar dificultad
        const validDifficulties = ['Fácil', 'Moderada', 'Difícil', 'Muy Difícil'];
        if (!validDifficulties.includes(route.difficulty)) {
            throw new ControlException('La dificultad debe ser: Fácil, Moderada, Difícil o Muy Difícil', 400);
        }

        // Validar que min_height <= max_height
        if (route.min_height > route.max_height) {
            throw new ControlException('La altura mínima no puede ser mayor que la altura máxima', 400);
        }
    }

    private async validateUniqueRouteName(name: string, excludeId?: number) {
        const existingRoutes = await this.routeDAL.getRoutes();
        const nameExists = existingRoutes.some((route: any) => 
            route.name.toLowerCase() === name.toLowerCase() && 
            (!excludeId || route.id !== excludeId)
        );
        
        if (nameExists) {
            throw new ControlException('Ya existe una ruta con ese nombre', 409);
        }
    }

}
