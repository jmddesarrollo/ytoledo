import ControlException from '../../utils/controlException';

const db = require("../../models");

const Routes = db.routes;

const { Op } = require("sequelize");

export default class RouteDAL {

    constructor() { }

    public getRoutes() {
        const routes = Routes.findAll({ raw: true, order: [['date', 'ASC']] })
            .catch(() => { throw new ControlException('Ha ocurrido un error al buscar las rutas', 500); });

        return routes;
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