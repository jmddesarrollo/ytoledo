import { Socket } from 'socket.io';

import { RouteController } from '../../controllers/ws/route.controller';

export const RouteRoutes = (socket: Socket) => {

    const routeController = new RouteController();        
    
    socket.on('route/getRoutes', (req: Request) => { routeController.getRoutes(req, socket)});
    socket.on('route/getRoute', (req: Request) => { routeController.getRoute(req, socket)});    
    socket.on('route/addRoute', (req: Request) => { routeController.addRoute(req, socket)});
    socket.on('route/editRoute', (req: Request) => { routeController.editRoute(req, socket)});
    socket.on('route/getNextRoute', (req: Request) => { routeController.getNextRoute(req, socket)});
    socket.on('route/deleteRoute', (req: Request) => { routeController.deleteRoute(req, socket)});
}
