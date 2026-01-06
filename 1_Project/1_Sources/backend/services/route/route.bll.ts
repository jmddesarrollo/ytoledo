import ControlException from '../../utils/controlException';

import RouteDAL from './route.dal';

const env = process.env.JMD_NODE_ENV || 'development';
const config = require('../../config/config')[env];
//

export default class RouteService {
    private routeDAL = new RouteDAL();

    constructor() { }

    public async getRoutes() {
        const routes = await this.routeDAL.getRoutes();

        return routes;
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
        const routeDb = await this.routeDAL.addRoute(route, t);

        return routeDb;
    }

    public async editRoute(route: any, t: any) {
        const routeDB = await this.getRoute(route.id);

        if (!routeDB) throw new ControlException('La ruta no ha sido encontrada', 412);

        routeDB.name = route.name;
        routeDB.lastname = route.lastname;
        routeDB.email = route.email;
        routeDB.routename = route.routename;
        routeDB.member_num = route.member_num;
        routeDB.active = route.active;
        routeDB.role_id = route.role_id;

        const routeOut = await this.routeDAL.editRoute(routeDB, t);

        return routeOut;
    }

    public async deleteRoute(routeId: number, t: any) {
        const routeDB = await this.getRoute(routeId);

        if (!routeDB) throw new ControlException('La ruta no ha sido encontrada', 412);

        await this.routeDAL.deleteRoute(routeId, t);

        return true;
    }

}
