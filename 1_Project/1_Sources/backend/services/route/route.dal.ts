import ControlException from '../../utils/controlException';

const db = require("../../models");

const Routes = db.routes;

const { Op } = require("sequelize");

export default class RouteDAL {

    constructor() { }

    public getRoutes(filters?: any) {
        let whereClause: any = {};
        let orderClause: any = [['date', 'ASC']];

        // Aplicar filtros si se proporcionan
        if (filters) {
            if (filters.difficulty) {
                whereClause.difficulty = filters.difficulty;
            }

            if (filters.minDistance || filters.maxDistance) {
                whereClause.distance_km = {};
                if (filters.minDistance) {
                    whereClause.distance_km[Op.gte] = filters.minDistance;
                }
                if (filters.maxDistance) {
                    whereClause.distance_km[Op.lte] = filters.maxDistance;
                }
            }

            if (filters.search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${filters.search}%` } },
                    { description: { [Op.like]: `%${filters.search}%` } }
                ];
            }

            if (filters.dateFrom) {
                whereClause.date = whereClause.date || {};
                whereClause.date[Op.gte] = filters.dateFrom;
            }

            if (filters.dateTo) {
                whereClause.date = whereClause.date || {};
                whereClause.date[Op.lte] = filters.dateTo;
            }

            // Ordenamiento personalizado
            if (filters.orderBy) {
                const direction = filters.orderDirection || 'ASC';
                orderClause = [[filters.orderBy, direction]];
            }
        }

        const queryOptions: any = {
            where: whereClause,
            order: orderClause,
            raw: true
        };

        // Paginación
        if (filters && filters.page && filters.limit) {
            const offset = (filters.page - 1) * filters.limit;
            queryOptions.limit = filters.limit;
            queryOptions.offset = offset;
        }

        const routes = Routes.findAll(queryOptions)
            .catch(() => { throw new ControlException('Ha ocurrido un error al buscar las rutas', 500); });

        return routes;
    }

    public async getRoutesCount(filters?: any) {
        let whereClause: any = {};

        // Aplicar los mismos filtros que en getRoutes
        if (filters) {
            if (filters.difficulty) {
                whereClause.difficulty = filters.difficulty;
            }

            if (filters.minDistance || filters.maxDistance) {
                whereClause.distance_km = {};
                if (filters.minDistance) {
                    whereClause.distance_km[Op.gte] = filters.minDistance;
                }
                if (filters.maxDistance) {
                    whereClause.distance_km[Op.lte] = filters.maxDistance;
                }
            }

            if (filters.search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${filters.search}%` } },
                    { description: { [Op.like]: `%${filters.search}%` } }
                ];
            }

            if (filters.dateFrom) {
                whereClause.date = whereClause.date || {};
                whereClause.date[Op.gte] = filters.dateFrom;
            }

            if (filters.dateTo) {
                whereClause.date = whereClause.date || {};
                whereClause.date[Op.lte] = filters.dateTo;
            }
        }

        const count = await Routes.count({ where: whereClause })
            .catch(() => { throw new ControlException('Ha ocurrido un error al contar las rutas', 500); });

        return count;
    }

    public getRoute(id: number) {
        const route = Routes.findOne({ where: { id } })
            .catch(() => { throw new ControlException('Ha ocurrido un error al buscar la ruta', 500); });
        return route;
    }

    public getNextRoute() {
        const today = new Date();
        const route = Routes.findOne({
            where: {
                date: {
                    [Op.gte]: today
                }
            },
            order: [['date', 'ASC']]
        })
            .catch(() => { throw new ControlException('Ha ocurrido un error al buscar la ruta próxima', 500); });
        return route;
    }

    public addRoute(route: any, t: any) {
        const routeDb = Routes.create(route, { transaction: t })
            .catch((err: any) => {
                if (err && err.errors[0]) {
                    if (err.errors[0].path === 'route_UNIQUE') throw new ControlException('El nombre de usuario ya existe para otro usuario', 500);

                    if (err.errors[0].message) throw new ControlException(err.errors[0].message, 500);
                }

                throw new ControlException('Ha ocurrido un error al crear la ruta', 500);
            });

        return routeDb;
    }

    public editRoute(route: any, t: any) {
        const routeDB = route.save({ transaction: t })
            .catch((err: any) => {
                if (err && err.errors[0]) {
                    if (err.errors[0].path === 'route_UNIQUE') throw new ControlException('El nombre de usuario ya existe para otro usuario', 500);
                    if (err.errors[0].message) throw new ControlException(err.errors[0].message, 500);
                }

                throw new ControlException('Ha ocurrido un error al editar la ruta', 500);
            });

        return routeDB;
    }

    public deleteRoute(routeId: number, t: any) {
        const routeDB = Routes.destroy({ where: { id: routeId }, transaction: t })
            .catch((err: any) => {
                if (err.index && err.index === 'fk_license_codes_routes1') throw new ControlException('No se permite eliminar la ruta porque ha generado códigos de licencias', 500);
                if (err.index && err.index === 'fk_licenses_routes1_idx') throw new ControlException('No se permite eliminar la ruta porque ha generado licencias', 500);

                throw new ControlException('Ha ocurrido un error al eliminar la ruta', 500);
            });

        return routeDB;
    }
}