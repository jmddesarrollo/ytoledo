import ControlException from '../../utils/controlException';

import RouteDAL from './route.dal';

const env = process.env.YTO_NODE_ENV || 'development';
const config = require('../../config/config')[env];
//

export default class RouteService {
    private routeDAL = new RouteDAL();

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

    public async addRoute(route: any, t: any) {
        // Validaciones básicas
        this.validateRouteData(route);
        
        // Verificar que el nombre sea único
        await this.validateUniqueRouteName(route.name);

        const routeDb = await this.routeDAL.addRoute(route, t);

        return routeDb;
    }

    public async editRoute(route: any, t: any) {
        const routeDB = await this.getRoute(route.id);

        if (!routeDB) throw new ControlException('La ruta no ha sido encontrada', 412);

        // Validaciones básicas
        this.validateRouteData(route);
        
        // Verificar que el nombre sea único (excluyendo la ruta actual)
        if (route.name && route.name !== routeDB.name) {
            await this.validateUniqueRouteName(route.name, route.id);
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

        await this.routeDAL.deleteRoute(routeId, t);

        return true;
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

        // Validar distancia si se proporciona
        if (route.distance_km !== undefined && route.distance_km !== null) {
            if (isNaN(route.distance_km) || route.distance_km < 0) {
                throw new ControlException('La distancia debe ser un número positivo', 400);
            }
        }

        // Validar descripción si se proporciona
        if (route.description && route.description.length > 1000) {
            throw new ControlException('La descripción no puede exceder 1000 caracteres', 400);
        }

        // Validar dificultad si se proporciona
        if (route.difficulty) {
            const validDifficulties = ['Fácil', 'Moderada', 'Difícil', 'Muy Difícil'];
            if (!validDifficulties.includes(route.difficulty)) {
                throw new ControlException('La dificultad debe ser: Fácil, Moderada, Difícil o Muy Difícil', 400);
            }
        }

        // Validar duración estimada si se proporciona
        if (route.estimated_duration_hours !== undefined && route.estimated_duration_hours !== null) {
            if (isNaN(route.estimated_duration_hours) || route.estimated_duration_hours < 0 || route.estimated_duration_hours > 23) {
                throw new ControlException('Las horas de duración deben estar entre 0 y 23', 400);
            }
        }
        
        if (route.estimated_duration_minutes !== undefined && route.estimated_duration_minutes !== null) {
            if (isNaN(route.estimated_duration_minutes) || route.estimated_duration_minutes < 0 || route.estimated_duration_minutes > 59) {
                throw new ControlException('Los minutos de duración deben estar entre 0 y 59', 400);
            }
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
